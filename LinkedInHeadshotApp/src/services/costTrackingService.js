/**
 * Cost Tracking and Analytics Service
 * Tracks API usage costs and provides detailed analytics for dual-provider architecture
 * 
 * Features:
 * - Real-time cost tracking per transformation
 * - Provider cost comparison and optimization
 * - Usage analytics and reporting
 * - Budget management and alerts
 * - Cost forecasting and trends
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsService } from './analyticsService';

// Cost Configuration
const COST_CONFIG = {
  PROVIDERS: {
    BETTERPIC: {
      costPerImage: 1.16,
      currency: 'USD',
      billingModel: 'per_image',
      tier: 'premium'
    },
    REPLICATE: {
      models: {
        'FLUX.1 Schnell': { cost: 0.025, currency: 'USD' },
        'FLUX.1 Dev': { cost: 0.04, currency: 'USD' },
        'InstantID': { cost: 0.03, currency: 'USD' }
      },
      billingModel: 'per_prediction',
      tier: 'standard'
    }
  },
  
  BUDGET_LIMITS: {
    daily: 50,
    weekly: 300,
    monthly: 1000
  },
  
  ALERT_THRESHOLDS: {
    budget_warning: 0.8,  // 80% of budget
    budget_critical: 0.95, // 95% of budget
    cost_spike: 2.0,      // 2x normal usage
    efficiency_drop: 0.5   // 50% efficiency drop
  },
  
  STORAGE_KEYS: {
    costs: 'cost_tracking_data',
    budgets: 'budget_settings',
    analytics: 'cost_analytics'
  }
};

export class CostTracker {
  constructor() {
    this.analytics = new AnalyticsService();
    this.costs = new Map();
    this.budgets = new Map();
    this.alerts = [];
    
    // Initialize from storage
    this.initializeFromStorage();
    
    // Start periodic analysis
    this.startPeriodicAnalysis();
  }

  /**
   * Track cost for a transformation
   */
  async trackCost(costData) {
    const {
      provider,
      model,
      cost,
      transformationId,
      predictionId,
      style,
      userId,
      quality,
      processingTime,
      success = true
    } = costData;

    try {
      const costRecord = {
        id: this.generateCostId(),
        provider,
        model: model || provider,
        cost: parseFloat(cost),
        currency: 'USD',
        transformationId,
        predictionId,
        style,
        userId,
        quality,
        processingTime,
        success,
        timestamp: new Date(),
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      };

      // Add to costs map
      this.costs.set(costRecord.id, costRecord);

      // Persist to storage
      await this.persistCostData();

      // Update running totals
      await this.updateRunningTotals(costRecord);

      // Check budget alerts
      await this.checkBudgetAlerts();

      // Track analytics
      await this.analytics.trackEvent('cost_tracked', {
        provider,
        cost,
        style,
        quality,
        success
      });

      console.log(`Cost tracked: ${provider} - $${cost} for ${style} style`);

      return costRecord.id;

    } catch (error) {
      console.error('Failed to track cost:', error);
      throw error;
    }
  }

  /**
   * Get cost summary for a date range
   */
  getCostSummary(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const relevantCosts = Array.from(this.costs.values()).filter(cost => {
      const costDate = new Date(cost.timestamp);
      return costDate >= start && costDate <= end;
    });

    const summary = {
      totalCost: 0,
      totalTransformations: relevantCosts.length,
      successfulTransformations: 0,
      failedTransformations: 0,
      byProvider: {},
      byStyle: {},
      byQuality: {},
      averageCostPerTransformation: 0,
      dateRange: { startDate, endDate }
    };

    // Calculate totals and breakdowns
    relevantCosts.forEach(cost => {
      summary.totalCost += cost.cost;
      
      if (cost.success) {
        summary.successfulTransformations++;
      } else {
        summary.failedTransformations++;
      }

      // By provider
      if (!summary.byProvider[cost.provider]) {
        summary.byProvider[cost.provider] = {
          cost: 0,
          count: 0,
          averageCost: 0
        };
      }
      summary.byProvider[cost.provider].cost += cost.cost;
      summary.byProvider[cost.provider].count++;

      // By style
      if (!summary.byStyle[cost.style]) {
        summary.byStyle[cost.style] = {
          cost: 0,
          count: 0,
          averageCost: 0
        };
      }
      summary.byStyle[cost.style].cost += cost.cost;
      summary.byStyle[cost.style].count++;

      // By quality
      if (!summary.byQuality[cost.quality]) {
        summary.byQuality[cost.quality] = {
          cost: 0,
          count: 0,
          averageCost: 0
        };
      }
      summary.byQuality[cost.quality].cost += cost.cost;
      summary.byQuality[cost.quality].count++;
    });

    // Calculate averages
    if (summary.totalTransformations > 0) {
      summary.averageCostPerTransformation = summary.totalCost / summary.totalTransformations;
    }

    // Calculate provider averages
    Object.keys(summary.byProvider).forEach(provider => {
      const data = summary.byProvider[provider];
      data.averageCost = data.count > 0 ? data.cost / data.count : 0;
    });

    // Calculate style averages
    Object.keys(summary.byStyle).forEach(style => {
      const data = summary.byStyle[style];
      data.averageCost = data.count > 0 ? data.cost / data.count : 0;
    });

    // Calculate quality averages
    Object.keys(summary.byQuality).forEach(quality => {
      const data = summary.byQuality[quality];
      data.averageCost = data.count > 0 ? data.cost / data.count : 0;
    });

    return summary;
  }

  /**
   * Get cost optimization recommendations
   */
  getCostOptimizationRecommendations() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const recentSummary = this.getCostSummary(thirtyDaysAgo, today);
    const recommendations = [];

    // Check provider efficiency
    const providers = Object.keys(recentSummary.byProvider);
    if (providers.length > 1) {
      const providerEfficiency = {};
      
      providers.forEach(provider => {
        const data = recentSummary.byProvider[provider];
        providerEfficiency[provider] = {
          ...data,
          costEfficiency: data.averageCost // Lower is better
        };
      });

      // Find most cost-effective provider
      const mostEfficient = Object.keys(providerEfficiency).reduce((a, b) => 
        providerEfficiency[a].costEfficiency < providerEfficiency[b].costEfficiency ? a : b
      );

      const leastEfficient = Object.keys(providerEfficiency).reduce((a, b) => 
        providerEfficiency[a].costEfficiency > providerEfficiency[b].costEfficiency ? a : b
      );

      const costDifference = providerEfficiency[leastEfficient].costEfficiency - 
                           providerEfficiency[mostEfficient].costEfficiency;

      if (costDifference > 0.10) { // $0.10 difference
        recommendations.push({
          type: 'provider_optimization',
          priority: 'high',
          title: 'Switch to More Cost-Effective Provider',
          description: `${mostEfficient} is $${costDifference.toFixed(2)} cheaper per transformation than ${leastEfficient}`,
          potentialSaving: costDifference * recentSummary.totalTransformations,
          recommendation: `Consider using ${mostEfficient} for budget-conscious transformations`
        });
      }
    }

    // Check style costs
    const styleData = recentSummary.byStyle;
    const highCostStyles = Object.keys(styleData).filter(style => 
      styleData[style].averageCost > recentSummary.averageCostPerTransformation * 1.2
    );

    if (highCostStyles.length > 0) {
      recommendations.push({
        type: 'style_optimization',
        priority: 'medium',
        title: 'Optimize High-Cost Styles',
        description: `Styles ${highCostStyles.join(', ')} are above average cost`,
        recommendation: 'Consider using fast processing for non-critical transformations in these styles'
      });
    }

    // Check processing efficiency
    const qualityData = recentSummary.byQuality;
    if (qualityData.premium && qualityData.fast) {
      const premiumCost = qualityData.premium.averageCost;
      const fastCost = qualityData.fast.averageCost;
      const costRatio = premiumCost / fastCost;

      if (costRatio > 10) {
        recommendations.push({
          type: 'quality_optimization',
          priority: 'medium',
          title: 'Balance Quality vs Cost',
          description: `Premium processing costs ${costRatio.toFixed(1)}x more than fast processing`,
          recommendation: 'Use fast processing for drafts and premium only for final versions'
        });
      }
    }

    // Budget utilization recommendations
    const dailySpend = this.getDailySpend();
    const monthlyBudget = this.budgets.get('monthly') || COST_CONFIG.BUDGET_LIMITS.monthly;
    const dailyBudget = monthlyBudget / 30;

    if (dailySpend > dailyBudget * 1.5) {
      recommendations.push({
        type: 'budget_warning',
        priority: 'high',
        title: 'High Daily Spending',
        description: `Today's spend ($${dailySpend.toFixed(2)}) is 50% above daily budget ($${dailyBudget.toFixed(2)})`,
        recommendation: 'Consider using more fast processing options to reduce costs'
      });
    }

    return recommendations;
  }

  /**
   * Set budget limits
   */
  async setBudget(period, amount) {
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      throw new Error('Invalid budget period. Use daily, weekly, or monthly.');
    }

    this.budgets.set(period, parseFloat(amount));
    await this.persistBudgetData();

    // Track budget setting
    await this.analytics.trackEvent('budget_set', {
      period,
      amount
    });

    console.log(`Budget set: ${period} = $${amount}`);
  }

  /**
   * Get current budget status
   */
  getBudgetStatus() {
    const today = new Date();
    const status = {};

    // Daily budget
    const dailySpend = this.getDailySpend();
    const dailyBudget = this.budgets.get('daily') || COST_CONFIG.BUDGET_LIMITS.daily;
    status.daily = {
      spent: dailySpend,
      budget: dailyBudget,
      remaining: dailyBudget - dailySpend,
      percentage: (dailySpend / dailyBudget) * 100
    };

    // Weekly budget
    const weeklySpend = this.getWeeklySpend();
    const weeklyBudget = this.budgets.get('weekly') || COST_CONFIG.BUDGET_LIMITS.weekly;
    status.weekly = {
      spent: weeklySpend,
      budget: weeklyBudget,
      remaining: weeklyBudget - weeklySpend,
      percentage: (weeklySpend / weeklyBudget) * 100
    };

    // Monthly budget
    const monthlySpend = this.getMonthlySpend();
    const monthlyBudget = this.budgets.get('monthly') || COST_CONFIG.BUDGET_LIMITS.monthly;
    status.monthly = {
      spent: monthlySpend,
      budget: monthlyBudget,
      remaining: monthlyBudget - monthlySpend,
      percentage: (monthlySpend / monthlyBudget) * 100
    };

    return status;
  }

  /**
   * Get cost trends and forecasting
   */
  getCostTrends() {
    const today = new Date();
    const trends = {
      daily: [],
      weekly: [],
      monthly: [],
      forecast: {}
    };

    // Daily trends for last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      const daySpend = this.getSpendForDate(dateStr);
      
      trends.daily.push({
        date: dateStr,
        spend: daySpend,
        transformations: this.getTransformationsForDate(dateStr)
      });
    }

    // Weekly trends for last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekEnd = new Date(today.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekStart = new Date(weekEnd.getTime() - (6 * 24 * 60 * 60 * 1000));
      const weekSpend = this.getSpendForDateRange(weekStart, weekEnd);
      
      trends.weekly.push({
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        spend: weekSpend,
        transformations: this.getTransformationsForDateRange(weekStart, weekEnd)
      });
    }

    // Forecast next 7 days based on recent trends
    const recentDailyAverage = trends.daily.slice(-7).reduce((sum, day) => sum + day.spend, 0) / 7;
    trends.forecast.nextWeek = recentDailyAverage * 7;
    trends.forecast.dailyAverage = recentDailyAverage;

    return trends;
  }

  /**
   * Export cost data for reporting
   */
  async exportCostData(format = 'json', startDate, endDate) {
    const costs = Array.from(this.costs.values());
    let filteredCosts = costs;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredCosts = costs.filter(cost => {
        const costDate = new Date(cost.timestamp);
        return costDate >= start && costDate <= end;
      });
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      totalRecords: filteredCosts.length,
      dateRange: { startDate, endDate },
      summary: this.getCostSummary(startDate, endDate),
      costs: filteredCosts
    };

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
        
      case 'csv':
        return this.convertToCsv(filteredCosts);
        
      default:
        return exportData;
    }
  }

  // Private methods

  async checkBudgetAlerts() {
    const status = this.getBudgetStatus();
    const newAlerts = [];

    ['daily', 'weekly', 'monthly'].forEach(period => {
      const periodStatus = status[period];
      const percentage = periodStatus.percentage / 100;

      if (percentage >= COST_CONFIG.ALERT_THRESHOLDS.budget_critical) {
        newAlerts.push({
          type: 'budget_critical',
          period,
          message: `Critical: ${Math.round(percentage * 100)}% of ${period} budget used`,
          percentage,
          spent: periodStatus.spent,
          budget: periodStatus.budget
        });
      } else if (percentage >= COST_CONFIG.ALERT_THRESHOLDS.budget_warning) {
        newAlerts.push({
          type: 'budget_warning',
          period,
          message: `Warning: ${Math.round(percentage * 100)}% of ${period} budget used`,
          percentage,
          spent: periodStatus.spent,
          budget: periodStatus.budget
        });
      }
    });

    if (newAlerts.length > 0) {
      this.alerts.push(...newAlerts);
      
      // Emit alert events
      newAlerts.forEach(alert => {
        this.analytics.trackEvent('budget_alert', alert);
      });
    }
  }

  getDailySpend() {
    const today = new Date().toISOString().split('T')[0];
    return this.getSpendForDate(today);
  }

  getWeeklySpend() {
    const today = new Date();
    const weekStart = new Date(today.getTime() - (6 * 24 * 60 * 60 * 1000));
    return this.getSpendForDateRange(weekStart, today);
  }

  getMonthlySpend() {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return this.getSpendForDateRange(monthStart, today);
  }

  getSpendForDate(dateStr) {
    return Array.from(this.costs.values())
      .filter(cost => cost.date === dateStr)
      .reduce((sum, cost) => sum + cost.cost, 0);
  }

  getTransformationsForDate(dateStr) {
    return Array.from(this.costs.values())
      .filter(cost => cost.date === dateStr).length;
  }

  getSpendForDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Array.from(this.costs.values())
      .filter(cost => {
        const costDate = new Date(cost.timestamp);
        return costDate >= start && costDate <= end;
      })
      .reduce((sum, cost) => sum + cost.cost, 0);
  }

  getTransformationsForDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Array.from(this.costs.values())
      .filter(cost => {
        const costDate = new Date(cost.timestamp);
        return costDate >= start && costDate <= end;
      }).length;
  }

  generateCostId() {
    return `cost_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  async updateRunningTotals(costRecord) {
    // Implementation for maintaining running totals
    // This could be used for quick dashboard updates
  }

  convertToCsv(costs) {
    const headers = ['Date', 'Provider', 'Model', 'Style', 'Quality', 'Cost', 'Success', 'Processing Time'];
    const rows = costs.map(cost => [
      cost.timestamp,
      cost.provider,
      cost.model,
      cost.style,
      cost.quality,
      cost.cost,
      cost.success,
      cost.processingTime
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  async persistCostData() {
    try {
      const costsArray = Array.from(this.costs.values());
      await AsyncStorage.setItem(COST_CONFIG.STORAGE_KEYS.costs, JSON.stringify(costsArray));
    } catch (error) {
      console.error('Failed to persist cost data:', error);
    }
  }

  async persistBudgetData() {
    try {
      const budgetsObj = Object.fromEntries(this.budgets);
      await AsyncStorage.setItem(COST_CONFIG.STORAGE_KEYS.budgets, JSON.stringify(budgetsObj));
    } catch (error) {
      console.error('Failed to persist budget data:', error);
    }
  }

  async initializeFromStorage() {
    try {
      // Load costs
      const costsData = await AsyncStorage.getItem(COST_CONFIG.STORAGE_KEYS.costs);
      if (costsData) {
        const costsArray = JSON.parse(costsData);
        costsArray.forEach(cost => {
          this.costs.set(cost.id, cost);
        });
      }

      // Load budgets
      const budgetsData = await AsyncStorage.getItem(COST_CONFIG.STORAGE_KEYS.budgets);
      if (budgetsData) {
        const budgetsObj = JSON.parse(budgetsData);
        Object.entries(budgetsObj).forEach(([period, amount]) => {
          this.budgets.set(period, amount);
        });
      }

      console.log(`Initialized cost tracker with ${this.costs.size} cost records`);

    } catch (error) {
      console.error('Failed to initialize from storage:', error);
    }
  }

  startPeriodicAnalysis() {
    // Run cost analysis every hour
    setInterval(() => {
      this.checkBudgetAlerts();
    }, 60 * 60 * 1000);
  }
}

export { COST_CONFIG };