import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  Text,
  Button,
  Badge,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Field,
  Select,
  Switch,
  Spinner,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  MoreVertical24Regular,
  Cloud24Regular,
  Key24Regular,
  Star24Filled,
  Star24Regular,
} from '@fluentui/react-icons';
import type { EnvironmentProfile, AuthenticationType } from '../../../shared/types/environment.types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  profileCard: {
    padding: tokens.spacingHorizontalM,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  profileCardSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileUrl: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
});

const AUTH_TYPE_OPTIONS: { value: AuthenticationType; label: string; description: string }[] = [
  { value: 'interactive', label: 'Interactive (Browser)', description: 'Sign in via browser popup' },
  { value: 'devicecode', label: 'Device Code', description: 'Sign in with a code on another device' },
  { value: 'serviceprincipal', label: 'Service Principal', description: 'App registration with client secret' },
];

interface EnvironmentProfileListProps {
  profiles: EnvironmentProfile[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (profile: Omit<EnvironmentProfile, 'id' | 'createdAt'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<EnvironmentProfile>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  onAuthenticate: (profileId: string) => Promise<{ success: boolean; error?: string }>;
}

export default function EnvironmentProfileList({
  profiles,
  selectedId,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
  onSetDefault,
  onAuthenticate,
}: EnvironmentProfileListProps) {
  const styles = useStyles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<EnvironmentProfile | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    authenticationType: 'interactive' as AuthenticationType,
    tenantId: '',
    clientId: '',
    isDefault: false,
  });

  const handleOpenDialog = (profile?: EnvironmentProfile) => {
    if (profile) {
      setEditingProfile(profile);
      setFormData({
        name: profile.name,
        url: profile.url,
        authenticationType: profile.authenticationType,
        tenantId: profile.tenantId || '',
        clientId: profile.clientId || '',
        isDefault: profile.isDefault,
      });
    } else {
      setEditingProfile(null);
      setFormData({
        name: '',
        url: '',
        authenticationType: 'interactive',
        tenantId: '',
        clientId: '',
        isDefault: profiles.length === 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingProfile) {
      await onUpdate(editingProfile.id, formData);
    } else {
      await onAdd(formData);
    }
    setIsDialogOpen(false);
  };

  const handleAuthenticate = async (profileId: string) => {
    setIsAuthenticating(profileId);
    setAuthError(null);

    const result = await onAuthenticate(profileId);

    setIsAuthenticating(null);
    if (!result.success) {
      setAuthError(result.error || 'Authentication failed');
    }
  };

  const getAuthTypeLabel = (type: AuthenticationType) => {
    return AUTH_TYPE_OPTIONS.find(o => o.value === type)?.label || type;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={500} weight="semibold">
          Environments ({profiles.length})
        </Text>
        <Button appearance="primary" icon={<Add24Regular />} onClick={() => handleOpenDialog()}>
          Add Environment
        </Button>
      </div>

      {authError && (
        <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalS }}>
          <MessageBarBody>{authError}</MessageBarBody>
        </MessageBar>
      )}

      {profiles.length === 0 ? (
        <div className={styles.emptyState}>
          <Cloud24Regular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalM }} />
          <Text size={400} weight="medium" block style={{ marginBottom: tokens.spacingVerticalS }}>
            No environments configured
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            Add a Power Platform environment to deploy your solutions
          </Text>
        </div>
      ) : (
        <div className={styles.profileList}>
          {profiles.map((profile) => {
            const isSelected = selectedId === profile.id;
            const isAuthLoading = isAuthenticating === profile.id;

            return (
              <Card
                key={profile.id}
                className={`${styles.profileCard} ${isSelected ? styles.profileCardSelected : ''}`}
                onClick={() => onSelect(isSelected ? null : profile.id)}
              >
                <div className={styles.profileHeader}>
                  <Cloud24Regular />
                  <div className={styles.profileInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                      <Text weight="semibold">{profile.name}</Text>
                      {profile.isDefault && (
                        <Tooltip content="Default environment" relationship="label">
                          <Star24Filled style={{ color: tokens.colorPaletteYellowForeground1, fontSize: '16px' }} />
                        </Tooltip>
                      )}
                    </div>
                    <Text className={styles.profileUrl}>{profile.url}</Text>
                    <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, marginTop: tokens.spacingVerticalXS }}>
                      <Badge appearance="outline" size="small">
                        {getAuthTypeLabel(profile.authenticationType)}
                      </Badge>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS }} onClick={(e) => e.stopPropagation()}>
                    <Tooltip content="Authenticate" relationship="label">
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={isAuthLoading ? <Spinner size="tiny" /> : <Key24Regular />}
                        onClick={() => handleAuthenticate(profile.id)}
                        disabled={isAuthLoading}
                      />
                    </Tooltip>
                    <Menu>
                      <MenuTrigger disableButtonEnhancement>
                        <Button appearance="subtle" size="small" icon={<MoreVertical24Regular />} />
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuList>
                          <MenuItem icon={<Edit24Regular />} onClick={() => handleOpenDialog(profile)}>
                            Edit
                          </MenuItem>
                          {!profile.isDefault && (
                            <MenuItem icon={<Star24Regular />} onClick={() => onSetDefault(profile.id)}>
                              Set as Default
                            </MenuItem>
                          )}
                          <MenuItem icon={<Delete24Regular />} onClick={() => onRemove(profile.id)}>
                            Delete
                          </MenuItem>
                        </MenuList>
                      </MenuPopover>
                    </Menu>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '500px' }}>
          <DialogBody>
            <DialogTitle>{editingProfile ? 'Edit Environment' : 'Add Environment'}</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <Field label="Name" required hint="Friendly name for this environment">
                  <Input
                    value={formData.name}
                    onChange={(_, data) => setFormData((prev) => ({ ...prev, name: data.value }))}
                    placeholder="e.g., Development, Production"
                  />
                </Field>

                <Field label="Environment URL" required hint="The Dataverse environment URL">
                  <Input
                    value={formData.url}
                    onChange={(_, data) => setFormData((prev) => ({ ...prev, url: data.value }))}
                    placeholder="https://yourorg.crm.dynamics.com"
                  />
                </Field>

                <Field label="Authentication Type" required>
                  <Select
                    value={formData.authenticationType}
                    onChange={(_, data) => setFormData((prev) => ({ ...prev, authenticationType: data.value as AuthenticationType }))}
                  >
                    {AUTH_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                {formData.authenticationType === 'serviceprincipal' && (
                  <>
                    <Field label="Tenant ID" required>
                      <Input
                        value={formData.tenantId}
                        onChange={(_, data) => setFormData((prev) => ({ ...prev, tenantId: data.value }))}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      />
                    </Field>
                    <Field label="Client ID (Application ID)" required>
                      <Input
                        value={formData.clientId}
                        onChange={(_, data) => setFormData((prev) => ({ ...prev, clientId: data.value }))}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      />
                    </Field>
                    <MessageBar intent="info">
                      <MessageBarBody>
                        Client secret will be requested when authenticating for security reasons.
                      </MessageBarBody>
                    </MessageBar>
                  </>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                  <Switch
                    checked={formData.isDefault}
                    onChange={(_, data) => setFormData((prev) => ({ ...prev, isDefault: data.checked }))}
                  />
                  <Text>Set as default environment</Text>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleSave}
                disabled={!formData.name || !formData.url}
              >
                {editingProfile ? 'Save Changes' : 'Add Environment'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
