# Cost Optimization Infrastructure Configuration
# Implements advanced cost optimization strategies across AWS services

# Karpenter for intelligent node provisioning
resource "helm_release" "karpenter" {
  count      = var.environment == "production" ? 1 : 0
  namespace  = "karpenter"
  create_namespace = true
  name       = "karpenter"
  repository = "oci://public.ecr.aws/karpenter"
  chart      = "karpenter"
  version    = "v0.31.0"
  
  values = [
    yamlencode({
      settings = {
        aws = {
          clusterName = var.cluster_name
          defaultInstanceProfile = aws_iam_instance_profile.karpenter_node_instance_profile[0].name
          enablePodENI = true
          isolatedVPC = false
          nodeClassRef = {
            name = "default"
          }
          tags = var.tags
        }
        # Aggressive cost optimization
        featureGates = {
          driftEnabled = true
          spotToSpotConsolidation = true
        }
      }
      # Resource allocation for Karpenter pods
      resources = {
        requests = {
          cpu = "100m"
          memory = "256Mi"
        }
        limits = {
          cpu = "500m"
          memory = "512Mi"
        }
      }
      # Tolerations for running on Spot instances
      tolerations = [
        {
          key = "karpenter.sh/do-not-evict"
          operator = "Exists"
        }
      ]
    })
  ]

  depends_on = [
    aws_iam_role_policy_attachment.karpenter_node_policy,
    aws_iam_role_policy_attachment.karpenter_worker_node_policy,
    aws_iam_role_policy_attachment.karpenter_cni_policy,
    aws_iam_role_policy_attachment.karpenter_registry_policy
  ]
}

# Karpenter NodeClass for cost-optimized instances
resource "kubectl_manifest" "karpenter_nodeclass" {
  count = var.environment == "production" ? 1 : 0
  yaml_body = yamlencode({
    apiVersion = "karpenter.k8s.aws/v1beta1"
    kind = "EC2NodeClass"
    metadata = {
      name = "cost-optimized-nodeclass"
    }
    spec = {
      instanceStorePolicy = "RAID0"  # Use instance store for better I/O performance
      amiFamily = "AL2"  # Amazon Linux 2
      subnetSelectorTerms = [
        {
          tags = {
            "karpenter.sh/discovery" = var.cluster_name
          }
        }
      ]
      securityGroupSelectorTerms = [
        {
          tags = {
            "karpenter.sh/discovery" = var.cluster_name
          }
        }
      ]
      instanceProfile = aws_iam_instance_profile.karpenter_node_instance_profile[0].name
      
      # User data for optimized container runtime
      userData = base64encode(templatefile("${path.module}/userdata.sh", {
        cluster_name = var.cluster_name
        region = var.aws_region
      }))
      
      # Block device mappings for cost optimization
      blockDeviceMappings = [
        {
          deviceName = "/dev/xvda"
          ebs = {
            volumeSize = 50  # Smaller root volume
            volumeType = "gp3"
            iops = 3000
            throughput = 125
            encrypted = true
            kmsKeyID = aws_kms_key.ebs.arn
            deleteOnTermination = true
          }
        }
      ]
      
      # Instance metadata service configuration
      metadataOptions = {
        httpEndpoint = "enabled"
        httpProtocolIPv6 = "disabled"
        httpPutResponseHopLimit = 2
        httpTokens = "required"
      }
      
      tags = merge(var.tags, {
        "karpenter.sh/discovery" = var.cluster_name
      })
    }
  })

  depends_on = [helm_release.karpenter]
}

# Karpenter NodePool with cost optimization focus
resource "kubectl_manifest" "karpenter_nodepool" {
  count = var.environment == "production" ? 1 : 0
  yaml_body = yamlencode({
    apiVersion = "karpenter.sh/v1beta1"
    kind = "NodePool"
    metadata = {
      name = "cost-optimized-nodepool"
    }
    spec = {
      # Template for node provisioning
      template = {
        metadata = {
          labels = {
            "node-type" = "cost-optimized"
            "karpenter.sh/capacity-type" = "spot"
          }
        }
        spec = {
          nodeClassRef = {
            name = "cost-optimized-nodeclass"
          }
          
          # Mixed instance types for cost optimization
          requirements = [
            {
              key = "karpenter.sh/capacity-type"
              operator = "In"
              values = ["spot", "on-demand"]
            },
            {
              key = "kubernetes.io/arch"
              operator = "In"
              values = ["amd64"]
            },
            {
              key = "node.kubernetes.io/instance-type"
              operator = "In"
              values = [
                # Cost-optimized instance types
                "c6i.large", "c6i.xlarge", "c6i.2xlarge",
                "c5n.large", "c5n.xlarge", "c5n.2xlarge",
                "c5.large", "c5.xlarge", "c5.2xlarge",
                "m6i.large", "m6i.xlarge", "m6i.2xlarge",
                "m5n.large", "m5n.xlarge", "m5n.2xlarge",
                "r5n.large", "r5n.xlarge"  # For memory-intensive workloads
              ]
            }
          ]
          
          # Startup and shutdown taints
          startupTaints = [
            {
              key = "karpenter.sh/do-not-schedule"
              value = "true"
              effect = "NoSchedule"
            }
          ]
          
          # Taints for spot instances
          taints = [
            {
              key = "karpenter.sh/do-not-evict"
              effect = "NoSchedule"
            }
          ]
        }
      }
      
      # Disruption settings for cost optimization
      disruption = {
        consolidationPolicy = "WhenUnderutilized"
        consolidateAfter = "30s"
        expireAfter = "30m"  # Terminate nodes after 30 minutes if unused
      }
      
      # Limits for cost control
      limits = {
        cpu = "1000"    # 1000 vCPUs max
        memory = "1000Gi"  # 1000 GB RAM max
      }
    }
  })

  depends_on = [kubectl_manifest.karpenter_nodeclass]
}

# Auto Scaling Group for On-Demand instances (baseline capacity)
resource "aws_autoscaling_group" "baseline" {
  count               = var.environment == "production" ? 1 : 0
  name                = "${var.cluster_name}-baseline-asg"
  vpc_zone_identifier = var.private_subnet_ids
  min_size            = 2
  max_size            = 4
  desired_capacity    = 2
  health_check_type   = "EC2"
  health_check_grace_period = 300
  
  # Use latest On-Demand instances for baseline
  launch_template {
    id      = aws_launch_template.baseline_nodes[0].id
    version = "$Latest"
  }
  
  # Instance refresh for rolling updates
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
      instance_warmup = 300
    }
  }
  
  tag {
    key                 = "Name"
    value               = "${var.cluster_name}-baseline-node"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "kubernetes.io/cluster/${var.cluster_name}"
    value               = "owned"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "karpenter.sh/discovery"
    value               = var.cluster_name
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Launch template for baseline On-Demand instances
resource "aws_launch_template" "baseline_nodes" {
  count         = var.environment == "production" ? 1 : 0
  name_prefix   = "${var.cluster_name}-baseline-"
  image_id      = data.aws_ami.eks_optimized.id
  instance_type = "c6i.large"  # Cost-effective baseline
  
  vpc_security_group_ids = [aws_security_group.eks_nodes.id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.karpenter_node_instance_profile[0].name
  }
  
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_type = "gp3"
      volume_size = 50
      iops        = 3000
      throughput  = 125
      encrypted   = true
      kms_key_id  = aws_kms_key.ebs.arn
      delete_on_termination = true
    }
  }
  
  user_data = base64encode(templatefile("${path.module}/userdata.sh", {
    cluster_name = var.cluster_name
    region = var.aws_region
  }))
  
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
    http_put_response_hop_limit = 2
  }
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(var.tags, {
      Name = "${var.cluster_name}-baseline-node"
      "node-type" = "baseline"
      "karpenter.sh/capacity-type" = "on-demand"
    })
  }
}

# IAM Instance Profile for Karpenter nodes
resource "aws_iam_instance_profile" "karpenter_node_instance_profile" {
  count = var.environment == "production" ? 1 : 0
  name  = "${var.cluster_name}-karpenter-node-instance-profile"
  role  = aws_iam_role.karpenter_node_role[0].name
}

# IAM Role for Karpenter nodes
resource "aws_iam_role" "karpenter_node_role" {
  count = var.environment == "production" ? 1 : 0
  name  = "${var.cluster_name}-karpenter-node-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
}

# Attach required policies to Karpenter node role
resource "aws_iam_role_policy_attachment" "karpenter_node_policy" {
  count      = var.environment == "production" ? 1 : 0
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.karpenter_node_role[0].name
}

resource "aws_iam_role_policy_attachment" "karpenter_worker_node_policy" {
  count      = var.environment == "production" ? 1 : 0
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.karpenter_node_role[0].name
}

resource "aws_iam_role_policy_attachment" "karpenter_cni_policy" {
  count      = var.environment == "production" ? 1 : 0
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.karpenter_node_role[0].name
}

resource "aws_iam_role_policy_attachment" "karpenter_registry_policy" {
  count      = var.environment == "production" ? 1 : 0
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.karpenter_node_role[0].name
}

# KMS Key for EBS encryption
resource "aws_kms_key" "ebs" {
  description             = "EBS encryption key for ${var.cluster_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = merge(var.tags, {
    Name = "${var.cluster_name}-ebs-key"
  })
}

resource "aws_kms_alias" "ebs" {
  name          = "alias/${var.cluster_name}-ebs"
  target_key_id = aws_kms_key.ebs.key_id
}

# Data source for EKS optimized AMI
data "aws_ami" "eks_optimized" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amazon-eks-node-1.27-v*"]
  }
  
  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# CloudWatch Dashboard for Cost Monitoring
resource "aws_cloudwatch_dashboard" "cost_optimization" {
  dashboard_name = "${var.cluster_name}-cost-optimization"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", "${var.cluster_name}-baseline-asg"],
            [".", ".", ".", "${var.cluster_name}-spot-asg"],
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "EC2 CPU Utilization by ASG"
          period  = 300
          stat    = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix],
            ["AWS/ApplicationELB", "RequestCount", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Application Load Balancer Metrics"
          period  = 300
        }
      }
    ]
  })
}

# Savings Plans recommendation (informational)
resource "aws_ce_anomaly_detector" "cost_anomaly" {
  count         = var.environment == "production" ? 1 : 0
  name          = "${var.cluster_name}-cost-anomaly-detector"
  monitor_type  = "DIMENSIONAL"
  
  specification = jsonencode({
    Dimension = "SERVICE"
    MatchOptions = ["EQUALS"]
    Values = ["Amazon Elastic Compute Cloud - Compute", "Amazon Elastic Kubernetes Service"]
  })
  
  tags = var.tags
}

# Cost budget for the cluster
resource "aws_budgets_budget" "cluster_cost" {
  count       = var.environment == "production" ? 1 : 0
  name        = "${var.cluster_name}-monthly-budget"
  budget_type = "COST"
  limit_amount = var.monthly_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  
  cost_filters = {
    Service = ["Amazon Elastic Compute Cloud - Compute", "Amazon Elastic Kubernetes Service"]
    Tag = {
      "kubernetes.io/cluster/${var.cluster_name}" = ["owned"]
    }
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = [var.budget_notification_email]
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_notification_email]
  }
}

# Variables for cost optimization
variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 2000
}

variable "budget_notification_email" {
  description = "Email for budget notifications"
  type        = string
  default     = ""
}