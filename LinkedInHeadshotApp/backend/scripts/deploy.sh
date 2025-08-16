#!/bin/bash

# OmniShot Backend Deployment Script
# Production-ready deployment automation with comprehensive checks and rollback capability

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/tmp/omnishot_deploy_${TIMESTAMP}.log"

# Default values
ENVIRONMENT=""
VERSION=""
SKIP_TESTS=false
SKIP_BACKUP=false
DRY_RUN=false
ROLLBACK_VERSION=""
FORCE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Help function
usage() {
    cat << EOF
OmniShot Backend Deployment Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV     Deployment environment (staging|production)
    -v, --version VERSION     Application version/tag to deploy
    -r, --rollback VERSION    Rollback to specified version
    -t, --skip-tests         Skip pre-deployment tests
    -b, --skip-backup        Skip database backup
    -d, --dry-run            Perform dry run without actual deployment
    -f, --force              Force deployment without confirmations
    -h, --help               Show this help message

Examples:
    $0 -e staging -v v1.2.3
    $0 -e production -v v1.2.3 -f
    $0 -e production -r v1.2.2
    $0 -e staging -d

EOF
    exit 0
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            -r|--rollback)
                ROLLBACK_VERSION="$2"
                shift 2
                ;;
            -t|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -b|--skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -h|--help)
                usage
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
}

# Validate inputs
validate_inputs() {
    if [[ -z "$ENVIRONMENT" ]]; then
        error "Environment is required. Use -e/--environment"
    fi

    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        error "Environment must be 'staging' or 'production'"
    fi

    if [[ -n "$ROLLBACK_VERSION" && -n "$VERSION" ]]; then
        error "Cannot specify both version and rollback version"
    fi

    if [[ -z "$ROLLBACK_VERSION" && -z "$VERSION" ]]; then
        error "Must specify either version (-v) or rollback version (-r)"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    local required_tools=("docker" "kubectl" "aws" "curl" "jq")
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool is required but not installed"
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured or invalid"
    fi
    
    # Check Kubernetes context
    if ! kubectl cluster-info &> /dev/null; then
        error "Kubernetes cluster not accessible"
    fi
    
    info "Prerequisites check passed"
}

# Load environment configuration
load_env_config() {
    local env_file="$PROJECT_ROOT/deploy/environments/$ENVIRONMENT.env"
    
    if [[ ! -f "$env_file" ]]; then
        error "Environment file not found: $env_file"
    fi
    
    source "$env_file"
    
    log "Loaded configuration for $ENVIRONMENT environment"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check cluster status
    if ! kubectl get nodes &> /dev/null; then
        error "Kubernetes cluster is not healthy"
    fi
    
    # Check database connectivity
    if ! kubectl exec -n "$NAMESPACE" deployment/postgres -- pg_isready -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
        error "Database is not accessible"
    fi
    
    # Check Redis connectivity
    if ! kubectl exec -n "$NAMESPACE" deployment/redis -- redis-cli ping &> /dev/null; then
        error "Redis is not accessible"
    fi
    
    # Check disk space
    local disk_usage
    disk_usage=$(kubectl top nodes --no-headers | awk '{print $4}' | sed 's/%//' | sort -n | tail -1)
    if [[ "$disk_usage" -gt 85 ]]; then
        warn "High disk usage detected: ${disk_usage}%"
        if [[ "$FORCE" != true ]]; then
            read -p "Continue anyway? [y/N]: " -r
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                error "Deployment aborted due to high disk usage"
            fi
        fi
    fi
    
    info "Pre-deployment checks passed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        warn "Skipping tests as requested"
        return
    fi
    
    log "Running test suite..."
    
    cd "$PROJECT_ROOT"
    
    # Run unit tests
    if ! npm run test; then
        error "Unit tests failed"
    fi
    
    # Run integration tests
    if ! npm run test:integration; then
        error "Integration tests failed"
    fi
    
    # Run security tests
    if ! npm audit --audit-level=high; then
        warn "Security audit found high-severity vulnerabilities"
        if [[ "$FORCE" != true ]]; then
            read -p "Continue anyway? [y/N]: " -r
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                error "Deployment aborted due to security vulnerabilities"
            fi
        fi
    fi
    
    info "All tests passed"
}

# Create database backup
create_backup() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        warn "Skipping backup as requested"
        return
    fi
    
    log "Creating database backup..."
    
    local backup_file="omnishot_${ENVIRONMENT}_${TIMESTAMP}.sql"
    
    if kubectl exec -n "$NAMESPACE" deployment/postgres -- pg_dump -U "$DB_USER" -d "$DB_NAME" > "/tmp/$backup_file"; then
        # Upload backup to S3
        if aws s3 cp "/tmp/$backup_file" "s3://$BACKUP_BUCKET/database/$backup_file"; then
            info "Database backup created: $backup_file"
            echo "$backup_file" > "/tmp/latest_backup.txt"
        else
            error "Failed to upload backup to S3"
        fi
    else
        error "Failed to create database backup"
    fi
}

# Build and push Docker image
build_and_push() {
    local target_version="${ROLLBACK_VERSION:-$VERSION}"
    
    log "Building Docker image for version: $target_version"
    
    cd "$PROJECT_ROOT"
    
    # Build image
    local image_tag="$ECR_REGISTRY/$ECR_REPOSITORY:$target_version"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would build image: $image_tag"
        return
    fi
    
    # Login to ECR
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
    
    # Build and tag image
    docker build -t "$image_tag" -f Dockerfile .
    
    # Push image
    docker push "$image_tag"
    
    # Tag as latest for this environment
    docker tag "$image_tag" "$ECR_REGISTRY/$ECR_REPOSITORY:$ENVIRONMENT-latest"
    docker push "$ECR_REGISTRY/$ECR_REPOSITORY:$ENVIRONMENT-latest"
    
    info "Docker image built and pushed: $image_tag"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    local target_version="${ROLLBACK_VERSION:-$VERSION}"
    
    log "Deploying to Kubernetes cluster..."
    
    # Update deployment manifest
    local manifest_file="/tmp/deployment-${ENVIRONMENT}.yaml"
    
    # Generate deployment manifest from template
    envsubst < "$PROJECT_ROOT/deploy/k8s/deployment.yaml.template" > "$manifest_file"
    
    # Replace image tag in manifest
    sed -i "s|IMAGE_TAG|$target_version|g" "$manifest_file"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would deploy with manifest:"
        cat "$manifest_file"
        return
    fi
    
    # Apply deployment
    kubectl apply -f "$manifest_file"
    
    # Wait for rollout to complete
    if ! kubectl rollout status deployment/omnishot-backend -n "$NAMESPACE" --timeout=600s; then
        error "Deployment rollout failed"
    fi
    
    info "Kubernetes deployment completed"
}

# Run database migrations
run_migrations() {
    if [[ -n "$ROLLBACK_VERSION" ]]; then
        warn "Skipping migrations for rollback deployment"
        return
    fi
    
    log "Running database migrations..."
    
    # Create migration job
    local job_manifest="/tmp/migration-job.yaml"
    
    envsubst < "$PROJECT_ROOT/deploy/k8s/migration-job.yaml.template" > "$job_manifest"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] Would run database migrations"
        return
    fi
    
    # Delete existing job if exists
    kubectl delete job omnishot-migration -n "$NAMESPACE" --ignore-not-found=true
    
    # Apply migration job
    kubectl apply -f "$job_manifest"
    
    # Wait for migration to complete
    if ! kubectl wait --for=condition=complete job/omnishot-migration -n "$NAMESPACE" --timeout=300s; then
        error "Database migration failed"
    fi
    
    info "Database migrations completed"
}

# Health checks
run_health_checks() {
    log "Running health checks..."
    
    local health_url="$APP_URL/api/health"
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -sf "$health_url" &> /dev/null; then
            info "Health check passed"
            return 0
        fi
        
        info "Health check attempt $attempt/$max_attempts failed, retrying in 10s..."
        sleep 10
        ((attempt++))
    done
    
    error "Health checks failed after $max_attempts attempts"
}

# Post-deployment verification
post_deployment_verification() {
    log "Running post-deployment verification..."
    
    # Check application metrics
    local metrics_url="$APP_URL/api/health/metrics"
    
    if curl -sf "$metrics_url" | jq -e '.status == "healthy"' &> /dev/null; then
        info "Application metrics are healthy"
    else
        warn "Application metrics check failed"
    fi
    
    # Check database connectivity
    if kubectl exec -n "$NAMESPACE" deployment/omnishot-backend -- node -e "
        const { DatabaseService } = require('./dist/services/database.service');
        DatabaseService.healthCheck().then(result => {
            if (result.connection) {
                console.log('Database connectivity verified');
                process.exit(0);
            } else {
                console.error('Database connectivity failed');
                process.exit(1);
            }
        }).catch(err => {
            console.error('Database check error:', err);
            process.exit(1);
        });
    "; then
        info "Database connectivity verified"
    else
        error "Database connectivity check failed"
    fi
    
    info "Post-deployment verification completed"
}

# Send notifications
send_notifications() {
    local status="$1"
    local target_version="${ROLLBACK_VERSION:-$VERSION}"
    
    log "Sending deployment notifications..."
    
    local message
    if [[ "$status" == "success" ]]; then
        if [[ -n "$ROLLBACK_VERSION" ]]; then
            message="🔄 Rollback to version $target_version completed successfully in $ENVIRONMENT environment"
        else
            message="🚀 Deployment of version $target_version completed successfully in $ENVIRONMENT environment"
        fi
    else
        if [[ -n "$ROLLBACK_VERSION" ]]; then
            message="❌ Rollback to version $target_version failed in $ENVIRONMENT environment"
        else
            message="❌ Deployment of version $target_version failed in $ENVIRONMENT environment"
        fi
    fi
    
    # Send Slack notification (if webhook is configured)
    if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK" || warn "Failed to send Slack notification"
    fi
    
    # Send email notification (if configured)
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "$message" | mail -s "OmniShot Deployment Notification" "$NOTIFICATION_EMAIL" || warn "Failed to send email notification"
    fi
    
    info "Notifications sent"
}

# Rollback function
rollback() {
    local backup_file
    
    error "Deployment failed, initiating rollback..."
    
    # Get latest backup
    if [[ -f "/tmp/latest_backup.txt" ]]; then
        backup_file=$(cat "/tmp/latest_backup.txt")
        
        warn "Rolling back database to backup: $backup_file"
        
        # Download backup from S3
        if aws s3 cp "s3://$BACKUP_BUCKET/database/$backup_file" "/tmp/$backup_file"; then
            # Restore database
            kubectl exec -n "$NAMESPACE" deployment/postgres -- psql -U "$DB_USER" -d "$DB_NAME" < "/tmp/$backup_file"
        fi
    fi
    
    # Rollback Kubernetes deployment
    kubectl rollout undo deployment/omnishot-backend -n "$NAMESPACE"
    
    send_notifications "failure"
    
    error "Rollback completed"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f /tmp/deployment-*.yaml
    rm -f /tmp/migration-job.yaml
    rm -f /tmp/latest_backup.txt
    rm -f /tmp/omnishot_*.sql
    
    # Clean up old Docker images
    docker image prune -f
    
    info "Cleanup completed"
}

# Confirmation prompt
confirm_deployment() {
    if [[ "$FORCE" == true ]] || [[ "$DRY_RUN" == true ]]; then
        return
    fi
    
    local target_version="${ROLLBACK_VERSION:-$VERSION}"
    local action="${ROLLBACK_VERSION:+rollback to}${VERSION:+deploy}"
    
    echo
    echo "=========================================="
    echo "DEPLOYMENT CONFIRMATION"
    echo "=========================================="
    echo "Environment: $ENVIRONMENT"
    echo "Action: $action"
    echo "Version: $target_version"
    echo "Time: $(date)"
    echo "=========================================="
    echo
    
    read -p "Are you sure you want to proceed? [y/N]: " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Deployment aborted by user"
    fi
}

# Main deployment function
main() {
    local start_time
    start_time=$(date +%s)
    
    log "Starting OmniShot deployment..."
    
    # Set trap for cleanup
    trap cleanup EXIT
    trap rollback ERR
    
    parse_args "$@"
    validate_inputs
    load_env_config
    check_prerequisites
    pre_deployment_checks
    confirm_deployment
    
    run_tests
    create_backup
    build_and_push
    deploy_to_kubernetes
    run_migrations
    run_health_checks
    post_deployment_verification
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "Deployment completed successfully in ${duration}s"
    send_notifications "success"
    
    echo
    echo "=========================================="
    echo "DEPLOYMENT SUMMARY"
    echo "=========================================="
    echo "Environment: $ENVIRONMENT"
    echo "Version: ${ROLLBACK_VERSION:-$VERSION}"
    echo "Duration: ${duration}s"
    echo "Status: SUCCESS ✅"
    echo "Log file: $LOG_FILE"
    echo "=========================================="
}

# Run main function with all arguments
main "$@"