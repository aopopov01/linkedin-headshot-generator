#!/usr/bin/env node

/**
 * Resource Monitoring Module
 * Monitors system resources during stress testing
 */

const { spawn } = require('child_process');
const colors = require('colors');
const fs = require('fs');

class ResourceMonitor {
    constructor() {
        this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        this.monitoring = false;
        this.data = {
            system: {
                timestamps: [],
                cpu: [],
                memory: [],
                networkConnections: [],
                diskIO: [],
                loadAverage: []
            },
            process: {
                timestamps: [],
                pid: null,
                cpu: [],
                memory: [],
                handles: [],
                threads: []
            },
            alerts: [],
            summary: {
                maxCpuUsage: 0,
                maxMemoryUsage: 0,
                maxConnections: 0,
                avgResponseTime: 0,
                totalAlerts: 0
            }
        };
        
        this.thresholds = {
            cpu: 80,      // CPU usage percentage
            memory: 85,   // Memory usage percentage
            connections: 1000,  // Active connections
            responseTime: 5000  // Response time in ms
        };
        
        this.monitoringInterval = 1000; // 1 second
        this.intervalId = null;
        this.backendPid = null;
    }

    async startMonitoring() {
        console.log(colors.blue('📊 Starting Resource Monitoring...\\n'));
        
        // Find backend process
        await this.findBackendProcess();
        
        this.monitoring = true;
        this.intervalId = setInterval(async () => {
            await this.collectMetrics();
        }, this.monitoringInterval);
        
        console.log(colors.green('✅ Resource monitoring started\\n'));
        
        // Run for specified duration or until stopped
        return new Promise((resolve) => {
            // Monitor for 60 seconds by default
            setTimeout(() => {
                this.stopMonitoring();
                resolve(this.generateReport());
            }, 60000);
        });
    }

    async findBackendProcess() {
        try {
            const nodeProcesses = await this.executeCommand('pgrep -f "node.*server.js"');
            const pids = nodeProcesses.trim().split('\\n').filter(pid => pid);
            
            if (pids.length > 0) {
                this.backendPid = parseInt(pids[0]);
                this.data.process.pid = this.backendPid;
                console.log(colors.yellow(`🔍 Found backend process: PID ${this.backendPid}`));
            } else {
                console.log(colors.yellow('⚠️  Backend process not found, monitoring system only'));
            }
        } catch (error) {
            console.log(colors.yellow('⚠️  Could not find backend process:', error.message));
        }
    }

    async collectMetrics() {
        const timestamp = Date.now();
        
        try {
            // Collect system metrics
            const systemMetrics = await this.collectSystemMetrics();
            this.data.system.timestamps.push(timestamp);
            this.data.system.cpu.push(systemMetrics.cpu);
            this.data.system.memory.push(systemMetrics.memory);
            this.data.system.networkConnections.push(systemMetrics.connections);
            this.data.system.loadAverage.push(systemMetrics.loadAverage);
            
            // Collect process metrics if backend PID is available
            if (this.backendPid) {
                const processMetrics = await this.collectProcessMetrics();
                this.data.process.timestamps.push(timestamp);
                this.data.process.cpu.push(processMetrics.cpu);
                this.data.process.memory.push(processMetrics.memory);
                this.data.process.handles.push(processMetrics.handles);
            }
            
            // Check thresholds and generate alerts
            this.checkThresholds(systemMetrics, timestamp);
            
            // Update summary
            this.updateSummary(systemMetrics);
            
        } catch (error) {
            console.log(colors.red('❌ Error collecting metrics:'), error.message);
        }
    }

    async collectSystemMetrics() {
        try {
            // CPU usage
            const cpuInfo = await this.executeCommand('top -bn1 | grep "Cpu(s)" | awk \'{print $2}\' | sed \'s/%us,//\'');
            const cpu = parseFloat(cpuInfo) || 0;
            
            // Memory usage
            const memInfo = await this.executeCommand('free | grep Mem | awk \'{print ($3/$2) * 100.0}\'');
            const memory = parseFloat(memInfo) || 0;
            
            // Network connections
            const netConnections = await this.executeCommand('ss -tun | wc -l');
            const connections = parseInt(netConnections) || 0;
            
            // Load average
            const loadInfo = await this.executeCommand('uptime | awk -F"load average:" \'{print $2}\' | cut -d"," -f1');
            const loadAverage = parseFloat(loadInfo) || 0;
            
            // Disk I/O
            const diskIO = await this.getDiskIOMetrics();
            
            return {
                cpu,
                memory,
                connections,
                loadAverage,
                diskIO
            };
        } catch (error) {
            console.log(colors.yellow('⚠️  Error collecting system metrics:'), error.message);
            return {
                cpu: 0,
                memory: 0,
                connections: 0,
                loadAverage: 0,
                diskIO: { read: 0, write: 0 }
            };
        }
    }

    async collectProcessMetrics() {
        try {
            if (!this.backendPid) return { cpu: 0, memory: 0, handles: 0 };
            
            // Process CPU usage
            const processCpu = await this.executeCommand(`ps -p ${this.backendPid} -o %cpu --no-headers`);
            const cpu = parseFloat(processCpu) || 0;
            
            // Process memory usage
            const processMemory = await this.executeCommand(`ps -p ${this.backendPid} -o %mem --no-headers`);
            const memory = parseFloat(processMemory) || 0;
            
            // File handles (approximation using lsof)
            const handles = await this.executeCommand(`lsof -p ${this.backendPid} 2>/dev/null | wc -l`);
            const handleCount = parseInt(handles) || 0;
            
            return {
                cpu,
                memory,
                handles: handleCount
            };
        } catch (error) {
            return { cpu: 0, memory: 0, handles: 0 };
        }
    }

    async getDiskIOMetrics() {
        try {
            const iostat = await this.executeCommand('iostat -x 1 1 | tail -n +4 | head -n 1');
            const values = iostat.trim().split(/\\s+/);
            
            return {
                read: parseFloat(values[5]) || 0,
                write: parseFloat(values[6]) || 0
            };
        } catch (error) {
            return { read: 0, write: 0 };
        }
    }

    checkThresholds(metrics, timestamp) {
        const alerts = [];
        
        if (metrics.cpu > this.thresholds.cpu) {
            alerts.push({
                type: 'CPU_HIGH',
                message: `High CPU usage: ${metrics.cpu.toFixed(1)}%`,
                threshold: this.thresholds.cpu,
                value: metrics.cpu,
                timestamp
            });
        }
        
        if (metrics.memory > this.thresholds.memory) {
            alerts.push({
                type: 'MEMORY_HIGH',
                message: `High memory usage: ${metrics.memory.toFixed(1)}%`,
                threshold: this.thresholds.memory,
                value: metrics.memory,
                timestamp
            });
        }
        
        if (metrics.connections > this.thresholds.connections) {
            alerts.push({
                type: 'CONNECTIONS_HIGH',
                message: `High connection count: ${metrics.connections}`,
                threshold: this.thresholds.connections,
                value: metrics.connections,
                timestamp
            });
        }
        
        if (metrics.loadAverage > 2.0) {
            alerts.push({
                type: 'LOAD_HIGH',
                message: `High system load: ${metrics.loadAverage.toFixed(2)}`,
                threshold: 2.0,
                value: metrics.loadAverage,
                timestamp
            });
        }
        
        alerts.forEach(alert => {
            this.data.alerts.push(alert);
            console.log(colors.red(`🚨 ALERT: ${alert.message}`));
        });
    }

    updateSummary(metrics) {
        this.data.summary.maxCpuUsage = Math.max(this.data.summary.maxCpuUsage, metrics.cpu);
        this.data.summary.maxMemoryUsage = Math.max(this.data.summary.maxMemoryUsage, metrics.memory);
        this.data.summary.maxConnections = Math.max(this.data.summary.maxConnections, metrics.connections);
        this.data.summary.totalAlerts = this.data.alerts.length;
    }

    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.monitoring = false;
        console.log(colors.green('✅ Resource monitoring stopped\\n'));
    }

    generateReport() {
        console.log(colors.cyan('📊 Resource Monitoring Report:\\n'));
        
        // Calculate averages
        const avgCpu = this.calculateAverage(this.data.system.cpu);
        const avgMemory = this.calculateAverage(this.data.system.memory);
        const avgConnections = this.calculateAverage(this.data.system.networkConnections);
        const avgLoad = this.calculateAverage(this.data.system.loadAverage);
        
        console.log(colors.yellow('System Metrics Summary:'));
        console.log(`  CPU Usage: avg ${avgCpu.toFixed(1)}%, max ${this.data.summary.maxCpuUsage.toFixed(1)}%`);
        console.log(`  Memory Usage: avg ${avgMemory.toFixed(1)}%, max ${this.data.summary.maxMemoryUsage.toFixed(1)}%`);
        console.log(`  Network Connections: avg ${avgConnections}, max ${this.data.summary.maxConnections}`);
        console.log(`  Load Average: avg ${avgLoad.toFixed(2)}`);
        
        if (this.backendPid) {
            const avgProcessCpu = this.calculateAverage(this.data.process.cpu);
            const avgProcessMemory = this.calculateAverage(this.data.process.memory);
            const avgHandles = this.calculateAverage(this.data.process.handles);
            
            console.log(colors.yellow('\\nBackend Process Metrics (PID ' + this.backendPid + '):'));
            console.log(`  CPU Usage: avg ${avgProcessCpu.toFixed(1)}%`);
            console.log(`  Memory Usage: avg ${avgProcessMemory.toFixed(1)}%`);
            console.log(`  File Handles: avg ${avgHandles}`);
        }
        
        if (this.data.alerts.length > 0) {
            console.log(colors.red('\\n🚨 Alerts Generated:'));
            const alertSummary = {};
            this.data.alerts.forEach(alert => {
                alertSummary[alert.type] = (alertSummary[alert.type] || 0) + 1;
            });
            
            Object.entries(alertSummary).forEach(([type, count]) => {
                console.log(colors.red(`  ${type}: ${count} occurrences`));
            });
        }
        
        // Resource bottleneck analysis
        const bottlenecks = this.identifyBottlenecks();
        if (bottlenecks.length > 0) {
            console.log(colors.yellow('\\n⚠️  Potential Bottlenecks:'));
            bottlenecks.forEach(bottleneck => {
                console.log(colors.yellow(`  • ${bottleneck}`));
            });
        }
        
        // Save detailed report
        const reportPath = `./results/resource-monitoring-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(this.data, null, 2));
        console.log(colors.green(`\\n💾 Detailed report saved to: ${reportPath}`));
        
        console.log(colors.green('\\n✅ Resource monitoring completed\\n'));
        
        // Return exit code based on critical issues
        const criticalIssues = this.data.alerts.filter(alert => 
            alert.type === 'CPU_HIGH' || alert.type === 'MEMORY_HIGH'
        ).length;
        
        process.exit(criticalIssues > 10 ? 1 : 0); // Fail if more than 10 critical alerts
    }

    identifyBottlenecks() {
        const bottlenecks = [];
        
        // CPU bottleneck
        if (this.data.summary.maxCpuUsage > 70) {
            bottlenecks.push(`CPU utilization peaked at ${this.data.summary.maxCpuUsage.toFixed(1)}%`);
        }
        
        // Memory bottleneck
        if (this.data.summary.maxMemoryUsage > 80) {
            bottlenecks.push(`Memory usage peaked at ${this.data.summary.maxMemoryUsage.toFixed(1)}%`);
        }
        
        // Connection bottleneck
        if (this.data.summary.maxConnections > 500) {
            bottlenecks.push(`High connection count: ${this.data.summary.maxConnections}`);
        }
        
        // Alert frequency
        if (this.data.alerts.length > 20) {
            bottlenecks.push(`High alert frequency: ${this.data.alerts.length} alerts in monitoring period`);
        }
        
        return bottlenecks;
    }

    calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }

    executeCommand(command) {
        return new Promise((resolve, reject) => {
            const process = spawn('bash', ['-c', command]);
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(stderr || `Command failed with code ${code}`));
                }
            });
            
            // Timeout after 5 seconds
            setTimeout(() => {
                process.kill();
                reject(new Error('Command timeout'));
            }, 5000);
        });
    }
}

// Run the resource monitor if this is the main module
if (require.main === module) {
    const monitor = new ResourceMonitor();
    monitor.startMonitoring().catch(error => {
        console.error(colors.red('Resource monitoring failed:'), error.message);
        process.exit(1);
    });
}

module.exports = ResourceMonitor;