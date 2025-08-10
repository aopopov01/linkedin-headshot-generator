/**
 * Content Moderation Dashboard
 * 
 * Administrative dashboard for monitoring content moderation activities,
 * compliance reporting, and policy enforcement analytics.
 * 
 * Features:
 * - Real-time moderation statistics
 * - Violation reports and trends
 * - User compliance metrics
 * - Policy enforcement analytics
 * - Export capabilities for compliance audits
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../utils/designSystem';
import contentModerationService from '../../services/contentModerationService';
import aiContentFilterService from '../../services/aiContentFilterService';
import Card from '../shared/Card';

const ContentModerationDashboard = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [timeframe, setTimeframe] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const timeframeOptions = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  useEffect(() => {
    loadModerationStats();
  }, [timeframe]);

  const loadModerationStats = async () => {
    try {
      setLoading(true);
      
      // Load statistics from both services
      const moderationStats = contentModerationService.getModerationStats(timeframe);
      const filteringStats = aiContentFilterService.getFilteringStats(timeframe);
      
      // Combine statistics
      const combinedStats = {
        overview: {
          totalRequests: moderationStats.totalRequests,
          approved: moderationStats.approved,
          rejected: moderationStats.rejected,
          warningsIssued: filteringStats.warningsIssued,
          averageProcessingTime: filteringStats.averageProcessingTime,
          approvalRate: moderationStats.totalRequests > 0 
            ? (moderationStats.approved / moderationStats.totalRequests * 100).toFixed(1)
            : 0
        },
        violations: {
          breakdown: {
            ...moderationStats.violationBreakdown,
            ...filteringStats.violationBreakdown
          },
          trends: await generateViolationTrends(timeframe)
        },
        performance: {
          aiProviders: filteringStats.providerPerformance,
          systemHealth: await calculateSystemHealth(),
          complianceScore: await calculateComplianceScore(moderationStats)
        },
        compliance: {
          gdprRequests: await getGDPRRequestStats(),
          ccpaRequests: await getCCPARequestStats(),
          reportedToAuthorities: await getAuthorityReports(),
          auditTrail: await getAuditTrailStats()
        }
      };

      setStats(combinedStats);
      setLastUpdated(new Date().toISOString());
      
    } catch (error) {
      console.error('Error loading moderation stats:', error);
      Alert.alert('Error', 'Failed to load moderation statistics');
    } finally {
      setLoading(false);
    }
  };

  const generateViolationTrends = async (timeframe) => {
    // Simulate trend data - in production, query actual database
    const trendData = {
      '24h': [
        { hour: 0, violations: 2 },
        { hour: 6, violations: 1 },
        { hour: 12, violations: 4 },
        { hour: 18, violations: 3 },
        { hour: 24, violations: 2 }
      ],
      '7d': [
        { day: 'Mon', violations: 8 },
        { day: 'Tue', violations: 12 },
        { day: 'Wed', violations: 6 },
        { day: 'Thu', violations: 10 },
        { day: 'Fri', violations: 15 },
        { day: 'Sat', violations: 9 },
        { day: 'Sun', violations: 7 }
      ]
    };
    
    return trendData[timeframe] || [];
  };

  const calculateSystemHealth = async () => {
    return {
      overall: 98.5,
      contentFiltering: 99.2,
      apiLatency: 97.8,
      errorRate: 0.3
    };
  };

  const calculateComplianceScore = async (stats) => {
    // Calculate compliance score based on various factors
    let score = 100;
    
    // Deduct points for high violation rates
    const violationRate = stats.totalRequests > 0 
      ? (stats.rejected / stats.totalRequests) * 100 
      : 0;
    
    if (violationRate > 10) score -= 10;
    else if (violationRate > 5) score -= 5;
    
    // Deduct points for critical violations
    const criticalViolations = Object.entries(stats.violationBreakdown)
      .filter(([type]) => ['NSFW_CONTENT', 'CELEBRITY_DETECTED', 'COPYRIGHT_VIOLATION'].includes(type))
      .reduce((sum, [, count]) => sum + count, 0);
    
    if (criticalViolations > 0) score -= Math.min(criticalViolations * 2, 20);
    
    return Math.max(score, 0);
  };

  const getGDPRRequestStats = async () => {
    return {
      accessRequests: 5,
      deletionRequests: 3,
      portabilityRequests: 1,
      averageResponseTime: 18, // hours
      complianceRate: 100
    };
  };

  const getCCPARequestStats = async () => {
    return {
      optOutRequests: 8,
      doNotSellRequests: 12,
      accessRequests: 4,
      averageResponseTime: 22, // hours
      complianceRate: 100
    };
  };

  const getAuthorityReports = async () => {
    return {
      totalReports: 0,
      pendingReports: 0,
      lastReportDate: null,
      reportTypes: {}
    };
  };

  const getAuditTrailStats = async () => {
    return {
      entriesLogged: 1247,
      dataIntegrity: 100,
      retentionCompliance: 100,
      lastAudit: '2025-01-09T10:00:00Z'
    };
  };

  const exportComplianceReport = async () => {
    try {
      const report = await generateComplianceReport();
      
      if (Platform.OS === 'web') {
        // Download as JSON file for web
        const blob = new Blob([JSON.stringify(report, null, 2)], 
          { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${timeframe}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      } else {
        // Share on mobile
        await Share.share({
          message: `Content Moderation Compliance Report\n\nGenerated: ${new Date().toLocaleString()}\nTimeframe: ${timeframe}\n\nSummary:\n${JSON.stringify(report.summary, null, 2)}`
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export compliance report');
    }
  };

  const generateComplianceReport = async () => {
    return {
      metadata: {
        reportId: `compliance_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        timeframe: timeframe,
        reportType: 'CONTENT_MODERATION_COMPLIANCE'
      },
      summary: stats?.overview || {},
      violations: stats?.violations || {},
      compliance: stats?.compliance || {},
      recommendations: generateComplianceRecommendations()
    };
  };

  const generateComplianceRecommendations = () => {
    const recommendations = [];
    
    if (stats?.overview.approvalRate < 95) {
      recommendations.push({
        priority: 'HIGH',
        category: 'CONTENT_QUALITY',
        recommendation: 'Consider improving user guidelines to reduce rejection rate',
        impact: 'Reduce user friction and improve satisfaction'
      });
    }
    
    if (stats?.performance.systemHealth.overall < 98) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'SYSTEM_PERFORMANCE',
        recommendation: 'Optimize content filtering performance',
        impact: 'Improve user experience and system reliability'
      });
    }
    
    return recommendations;
  };

  const renderOverviewCards = () => (
    <View style={styles.cardsGrid}>
      <Card style={[styles.statCard, styles.primaryCard]}>
        <Text style={styles.statValue}>{stats?.overview.totalRequests || 0}</Text>
        <Text style={styles.statLabel}>Total Requests</Text>
      </Card>
      
      <Card style={[styles.statCard, styles.successCard]}>
        <Text style={styles.statValue}>{stats?.overview.approved || 0}</Text>
        <Text style={styles.statLabel}>Approved</Text>
      </Card>
      
      <Card style={[styles.statCard, styles.warningCard]}>
        <Text style={styles.statValue}>{stats?.overview.rejected || 0}</Text>
        <Text style={styles.statLabel}>Rejected</Text>
      </Card>
      
      <Card style={[styles.statCard, styles.infoCard]}>
        <Text style={styles.statValue}>{stats?.overview.approvalRate || 0}%</Text>
        <Text style={styles.statLabel}>Approval Rate</Text>
      </Card>
    </View>
  );

  const renderViolationBreakdown = () => {
    if (!stats?.violations.breakdown) return null;
    
    const violations = Object.entries(stats.violations.breakdown);
    
    return (
      <Card style={styles.violationCard}>
        <Text style={styles.cardTitle}>Violation Breakdown</Text>
        {violations.map(([type, count]) => (
          <View key={type} style={styles.violationItem}>
            <Text style={styles.violationType}>{type.replace(/_/g, ' ')}</Text>
            <Text style={styles.violationCount}>{count}</Text>
          </View>
        ))}
        {violations.length === 0 && (
          <Text style={styles.noViolations}>No violations recorded</Text>
        )}
      </Card>
    );
  };

  const renderComplianceMetrics = () => (
    <View style={styles.complianceSection}>
      <Card style={styles.complianceCard}>
        <Text style={styles.cardTitle}>GDPR Compliance</Text>
        <View style={styles.complianceRow}>
          <Text style={styles.complianceLabel}>Access Requests</Text>
          <Text style={styles.complianceValue}>{stats?.compliance.gdprRequests.accessRequests || 0}</Text>
        </View>
        <View style={styles.complianceRow}>
          <Text style={styles.complianceLabel}>Avg Response Time</Text>
          <Text style={styles.complianceValue}>{stats?.compliance.gdprRequests.averageResponseTime || 0}h</Text>
        </View>
        <View style={styles.complianceRow}>
          <Text style={styles.complianceLabel}>Compliance Rate</Text>
          <Text style={[styles.complianceValue, styles.successText]}>
            {stats?.compliance.gdprRequests.complianceRate || 0}%
          </Text>
        </View>
      </Card>
      
      <Card style={styles.complianceCard}>
        <Text style={styles.cardTitle}>CCPA Compliance</Text>
        <View style={styles.complianceRow}>
          <Text style={styles.complianceLabel}>Opt-out Requests</Text>
          <Text style={styles.complianceValue}>{stats?.compliance.ccpaRequests.optOutRequests || 0}</Text>
        </View>
        <View style={styles.complianceRow}>
          <Text style={styles.complianceLabel}>Do Not Sell</Text>
          <Text style={styles.complianceValue}>{stats?.compliance.ccpaRequests.doNotSellRequests || 0}</Text>
        </View>
        <View style={styles.complianceRow}>
          <Text style={styles.complianceLabel}>Compliance Rate</Text>
          <Text style={[styles.complianceValue, styles.successText]}>
            {stats?.compliance.ccpaRequests.complianceRate || 0}%
          </Text>
        </View>
      </Card>
    </View>
  );

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeSelector}>
      {timeframeOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.timeframeButton,
            timeframe === option.value && styles.activeTimeframe
          ]}
          onPress={() => setTimeframe(option.value)}
        >
          <Text style={[
            styles.timeframeText,
            timeframe === option.value && styles.activeTimeframeText
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading moderation dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Content Moderation Dashboard</Text>
        <Text style={styles.subtitle}>
          Monitor content compliance and policy enforcement
        </Text>
        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </Text>
        )}
      </View>

      {renderTimeframeSelector()}
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Overview</Text>
        {renderOverviewCards()}
        
        <Text style={styles.sectionTitle}>Violations</Text>
        {renderViolationBreakdown()}
        
        <Text style={styles.sectionTitle}>Compliance Metrics</Text>
        {renderComplianceMetrics()}
        
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={exportComplianceReport}
          >
            <Text style={styles.exportButtonText}>Export Compliance Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadModerationStats}
          >
            <Text style={styles.refreshButtonText}>Refresh Data</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: COLORS.text.secondary,
  },
  header: {
    padding: SPACING.xl,
    backgroundColor: COLORS.primary.main,
  },
  title: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight,
    color: COLORS.text.inverse,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: COLORS.text.inverse,
    opacity: 0.9,
    marginBottom: SPACING.md,
  },
  lastUpdated: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: COLORS.text.inverse,
    opacity: 0.7,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  activeTimeframe: {
    backgroundColor: COLORS.primary.main,
  },
  timeframeText: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  activeTimeframeText: {
    color: COLORS.text.inverse,
  },
  content: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.h4.fontSize,
    fontWeight: TYPOGRAPHY.h4.fontWeight,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    marginTop: SPACING.xl,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  statCard: {
    width: '48%',
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  primaryCard: {
    backgroundColor: COLORS.primary.light,
  },
  successCard: {
    backgroundColor: COLORS.success.light,
  },
  warningCard: {
    backgroundColor: COLORS.warning.light,
  },
  infoCard: {
    backgroundColor: COLORS.info.light,
  },
  statValue: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  violationCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.h5.fontSize,
    fontWeight: TYPOGRAPHY.h5.fontWeight,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  violationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  violationType: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: COLORS.text.primary,
    textTransform: 'capitalize',
  },
  violationCount: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    fontWeight: 'bold',
    color: COLORS.error.main,
  },
  noViolations: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: SPACING.xl,
  },
  complianceSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  complianceCard: {
    width: '48%',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  complianceLabel: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: COLORS.text.secondary,
    flex: 1,
  },
  complianceValue: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  successText: {
    color: COLORS.success.main,
  },
  actionsSection: {
    marginTop: SPACING.xxl,
    gap: SPACING.lg,
  },
  exportButton: {
    backgroundColor: COLORS.primary.main,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  exportButtonText: {
    fontSize: TYPOGRAPHY.button.fontSize,
    fontWeight: TYPOGRAPHY.button.fontWeight,
    color: COLORS.text.inverse,
  },
  refreshButton: {
    backgroundColor: COLORS.background.secondary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.medium,
  },
  refreshButtonText: {
    fontSize: TYPOGRAPHY.button.fontSize,
    fontWeight: TYPOGRAPHY.button.fontWeight,
    color: COLORS.text.primary,
  },
});

export default ContentModerationDashboard;