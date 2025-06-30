# Monthly License Scheduler

## Overview

The `LicenseScheduler` class provides automated monthly license validation for the POS system. It ensures that the software remains properly licensed and handles license expiration gracefully.

## Features

- **Automated Monthly Checks**: Validates license every 30 days
- **Offline Tolerance**: Allows up to 3 missed checks for offline scenarios
- **Network Awareness**: Detects internet connectivity and reschedules accordingly
- **Persistent State**: Maintains scheduler state across application restarts
- **Grace Period**: Provides reasonable offline operation time

## How It Works

1. **Initialization**: Sets up the scheduler when the application starts
2. **Monthly Validation**: Automatically checks license validity every 30 days
3. **Network Detection**: Monitors internet connectivity for license validation
4. **State Management**: Persists check history and scheduling information
5. **Grace Period**: Allows continued operation during temporary network issues

## Configuration

```typescript
// Scheduler constants
private static readonly MONTHLY_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days
private static readonly MAX_MISSED_CHECKS = 3; // Grace period
```

## API Reference

### Static Methods

#### `initialize(): void`
Initializes the scheduler and sets up network listeners.

#### `getStatus(): SchedulerStatus`
Returns current scheduler status including:
- Last monthly check timestamp
- Next scheduled check time
- Number of missed checks
- Whether a check is currently due

#### `reset(): void`
Resets all scheduler state (for testing/debugging only).

#### `cleanup(): void`
Cleans up timers and event listeners.

## State Management

The scheduler maintains persistent state in localStorage:

```typescript
interface SchedulerState {
  lastMonthlyCheck: string | null;
  nextScheduledCheck: string | null;
  missedChecks: number;
}
```

## Network Handling

The scheduler intelligently handles network connectivity:

1. **Online Detection**: Uses `navigator.onLine` and connectivity tests
2. **Graceful Degradation**: Continues operation during temporary outages
3. **Automatic Recovery**: Resumes checking when connectivity returns

## License Validation Process

1. **Connectivity Test**: Verifies internet connection
2. **License Refresh**: Calls `LicenseService.refreshLicense()`
3. **Result Handling**: Updates state and schedules next check
4. **Error Management**: Logs failures and maintains missed check count

## Integration

### Setup in Application

```typescript
// Initialize scheduler during app startup
LicenseScheduler.initialize();

// Check current status
const status = LicenseScheduler.getStatus();
```

### Monitoring and Debugging

```typescript
// Check if scheduler is working properly
const status = LicenseScheduler.getStatus();
console.log('Scheduler Status:', {
  lastCheck: status.lastMonthlyCheck,
  nextCheck: status.nextScheduledCheck,
  missedChecks: status.missedChecks,
  isDue: status.isDue
});
```

## Best Practices

1. **Initialize Early**: Call `initialize()` during application startup
2. **Monitor Status**: Regularly check scheduler status in admin interfaces
3. **Handle Errors**: Implement proper error handling for license failures
4. **Test Scenarios**: Verify behavior in offline and online scenarios

## Troubleshooting

### Common Issues

1. **Scheduler Not Running**
   - Verify `initialize()` was called
   - Check browser console for errors

2. **License Checks Failing**
   - Verify network connectivity
   - Check license server availability
   - Validate license configuration

3. **State Not Persisting**
   - Check localStorage availability
   - Verify storage permissions

### Debugging Steps

1. Check scheduler status: `LicenseScheduler.getStatus()`
2. Verify network connectivity manually
3. Check browser console for scheduler logs
4. Validate license service configuration

## Security Considerations

- **No Local Storage of Keys**: Only validation state is stored locally
- **Server Validation**: All license checks go through secure server validation
- **Tamper Protection**: State manipulation doesn't bypass license validation
- **Grace Period Limits**: Maximum offline operation time is enforced

## Performance Impact

- **Minimal CPU Usage**: Only runs monthly checks
- **Low Memory Footprint**: Maintains minimal state
- **Network Efficient**: Uses connectivity tests to avoid unnecessary requests
- **Storage Efficient**: Stores only essential scheduling information

## Future Enhancements

- **Configurable Intervals**: Allow custom check frequencies
- **Multiple License Types**: Support different validation schedules
- **Enhanced Monitoring**: Detailed analytics and reporting
- **Smart Scheduling**: Optimize check timing based on usage patterns 