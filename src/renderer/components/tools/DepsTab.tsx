import {
  makeStyles,
  tokens,
  Button,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
  Card,
  CardHeader,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
} from '@fluentui/react-components';
import { Shield24Regular, ArrowSync24Regular } from '@fluentui/react-icons';
import { useToolsStore } from '../../stores/tools.store';
import { useProjectStore } from '../../stores/project.store';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  severityCounts: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  severityBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
});

export default function DepsTab() {
  const styles = useStyles();
  const { currentProject } = useProjectStore();
  const {
    auditLoading,
    auditResult,
    auditError,
    outdatedLoading,
    outdatedResult,
    outdatedError,
    fixLoading,
    runAudit,
    runOutdated,
    runAuditFix,
    runUpdate,
  } = useToolsStore();

  const handleAudit = async () => {
    if (!currentProject?.path) return;
    await runAudit(currentProject.path);
  };

  const handleOutdated = async () => {
    if (!currentProject?.path) return;
    await runOutdated(currentProject.path);
  };

  const handleAuditFix = async () => {
    if (!currentProject?.path) return;
    await runAuditFix(currentProject.path);
  };

  const handleUpdateAll = async () => {
    if (!currentProject?.path) return;
    await runUpdate(currentProject.path);
  };

  if (!currentProject) {
    return (
      <MessageBar intent="warning">
        <MessageBarBody>Open a project to manage dependencies.</MessageBarBody>
      </MessageBar>
    );
  }

  const severityColor = (severity: string): 'danger' | 'warning' | 'informative' | 'important' | 'success' => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'danger';
      case 'moderate': return 'warning';
      case 'low': return 'informative';
      default: return 'informative';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <Button
          appearance="primary"
          icon={<Shield24Regular />}
          onClick={handleAudit}
          disabled={auditLoading}
        >
          {auditLoading ? 'Auditing...' : 'Run Audit'}
        </Button>
        <Button
          appearance="secondary"
          icon={<ArrowSync24Regular />}
          onClick={handleOutdated}
          disabled={outdatedLoading}
        >
          {outdatedLoading ? 'Checking...' : 'Check Outdated'}
        </Button>
        {(auditLoading || outdatedLoading) && <Spinner size="tiny" />}
      </div>

      {auditError && (
        <MessageBar intent="error">
          <MessageBarBody>{auditError}</MessageBarBody>
        </MessageBar>
      )}

      {auditResult && (
        <Card>
          <CardHeader
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
                <Text weight="semibold">
                  Audit Results ({auditResult.totalVulnerabilities} vulnerabilities)
                </Text>
                {auditResult.totalVulnerabilities > 0 && (
                  <Button
                    appearance="subtle"
                    size="small"
                    onClick={handleAuditFix}
                    disabled={fixLoading}
                  >
                    {fixLoading ? 'Fixing...' : 'Auto Fix'}
                  </Button>
                )}
              </div>
            }
          />

          {auditResult.totalVulnerabilities === 0 ? (
            <MessageBar intent="success" style={{ margin: tokens.spacingVerticalS }}>
              <MessageBarBody>No vulnerabilities found.</MessageBarBody>
            </MessageBar>
          ) : (
            <>
              <div className={styles.severityCounts} style={{ padding: tokens.spacingVerticalS }}>
                {Object.entries(auditResult.severityCounts)
                  .filter(([, count]) => count > 0)
                  .map(([severity, count]) => (
                    <div key={severity} className={styles.severityBadge}>
                      <Badge appearance="filled" color={severityColor(severity)} size="small">
                        {severity}
                      </Badge>
                      <Text size={200}>{count}</Text>
                    </div>
                  ))}
              </div>

              <Table size="small">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Package</TableHeaderCell>
                    <TableHeaderCell>Severity</TableHeaderCell>
                    <TableHeaderCell>Title</TableHeaderCell>
                    <TableHeaderCell>Fix Available</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditResult.vulnerabilities.map((vuln, i) => (
                    <TableRow key={i}>
                      <TableCell>{vuln.name}</TableCell>
                      <TableCell>
                        <Badge appearance="filled" color={severityColor(vuln.severity)} size="small">
                          {vuln.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{vuln.title}</TableCell>
                      <TableCell>
                        {vuln.fixAvailable ? (
                          <Badge appearance="outline" color="success" size="small">Yes</Badge>
                        ) : (
                          <Badge appearance="outline" color="danger" size="small">No</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </Card>
      )}

      {outdatedError && (
        <MessageBar intent="error">
          <MessageBarBody>{outdatedError}</MessageBarBody>
        </MessageBar>
      )}

      {outdatedResult && (
        <Card>
          <CardHeader
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
                <Text weight="semibold">
                  Outdated Packages ({outdatedResult.totalOutdated})
                </Text>
                {outdatedResult.totalOutdated > 0 && (
                  <Button
                    appearance="subtle"
                    size="small"
                    onClick={handleUpdateAll}
                    disabled={fixLoading}
                  >
                    {fixLoading ? 'Updating...' : 'Update All'}
                  </Button>
                )}
              </div>
            }
          />

          {outdatedResult.totalOutdated === 0 ? (
            <MessageBar intent="success" style={{ margin: tokens.spacingVerticalS }}>
              <MessageBarBody>All packages are up to date.</MessageBarBody>
            </MessageBar>
          ) : (
            <Table size="small">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Package</TableHeaderCell>
                  <TableHeaderCell>Current</TableHeaderCell>
                  <TableHeaderCell>Wanted</TableHeaderCell>
                  <TableHeaderCell>Latest</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outdatedResult.packages.map((pkg) => (
                  <TableRow key={pkg.name}>
                    <TableCell>{pkg.name}</TableCell>
                    <TableCell>
                      <Badge appearance="outline" color="danger" size="small">
                        {pkg.current}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge appearance="outline" color="warning" size="small">
                        {pkg.wanted}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge appearance="outline" color="success" size="small">
                        {pkg.latest}
                      </Badge>
                    </TableCell>
                    <TableCell>{pkg.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
