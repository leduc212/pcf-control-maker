import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import type {
  GitStatus,
  GitFileChange,
  GitBranch,
  GitCommit,
  GitCommitOptions,
  GitPushOptions,
  GitPullOptions,
  GitChangeStatus,
} from '../../shared/types/git.types';

const execAsync = promisify(exec);

export class GitService {
  private async runGitCommand(
    cwd: string,
    command: string
  ): Promise<{ stdout: string; stderr: string }> {
    try {
      return await execAsync(`git ${command}`, {
        cwd,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0', // Disable prompts
        },
      });
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; message: string };
      // Return output even on error (git sometimes exits with non-zero for valid reasons)
      if (execError.stdout !== undefined || execError.stderr !== undefined) {
        return { stdout: execError.stdout || '', stderr: execError.stderr || '' };
      }
      throw error;
    }
  }

  /**
   * Check if directory is a git repository
   */
  async isGitRepo(projectPath: string): Promise<boolean> {
    try {
      await this.runGitCommand(projectPath, 'rev-parse --is-inside-work-tree');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get git status
   */
  async getStatus(projectPath: string): Promise<GitStatus> {
    const isRepo = await this.isGitRepo(projectPath);
    if (!isRepo) {
      return {
        isRepo: false,
        branch: '',
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        untracked: [],
        hasChanges: false,
      };
    }

    try {
      // Get branch info
      const { stdout: branchOutput } = await this.runGitCommand(
        projectPath,
        'branch --show-current'
      );
      const branch = branchOutput.trim();

      // Get ahead/behind info
      let ahead = 0;
      let behind = 0;
      try {
        const { stdout: trackOutput } = await this.runGitCommand(
          projectPath,
          'rev-list --left-right --count HEAD...@{upstream}'
        );
        const [a, b] = trackOutput.trim().split(/\s+/);
        ahead = parseInt(a, 10) || 0;
        behind = parseInt(b, 10) || 0;
      } catch {
        // No upstream branch
      }

      // Get status
      const { stdout: statusOutput } = await this.runGitCommand(
        projectPath,
        'status --porcelain=v1'
      );

      const staged: GitFileChange[] = [];
      const unstaged: GitFileChange[] = [];
      const untracked: string[] = [];

      const lines = statusOutput.split('\n').filter((l) => l.trim());
      for (const line of lines) {
        const indexStatus = line[0];
        const workTreeStatus = line[1];
        const filePath = line.slice(3);

        if (indexStatus === '?' && workTreeStatus === '?') {
          untracked.push(filePath);
        } else {
          if (indexStatus !== ' ' && indexStatus !== '?') {
            staged.push({
              path: filePath,
              status: this.parseStatus(indexStatus),
            });
          }
          if (workTreeStatus !== ' ' && workTreeStatus !== '?') {
            unstaged.push({
              path: filePath,
              status: this.parseStatus(workTreeStatus),
            });
          }
        }
      }

      return {
        isRepo: true,
        branch,
        ahead,
        behind,
        staged,
        unstaged,
        untracked,
        hasChanges: staged.length > 0 || unstaged.length > 0 || untracked.length > 0,
      };
    } catch (error) {
      console.error('Failed to get git status:', error);
      return {
        isRepo: true,
        branch: '',
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        untracked: [],
        hasChanges: false,
      };
    }
  }

  private parseStatus(char: string): GitChangeStatus {
    switch (char) {
      case 'A':
        return 'added';
      case 'M':
        return 'modified';
      case 'D':
        return 'deleted';
      case 'R':
        return 'renamed';
      case 'C':
        return 'copied';
      case 'U':
        return 'unmerged';
      default:
        return 'modified';
    }
  }

  /**
   * Get list of branches
   */
  async getBranches(projectPath: string): Promise<GitBranch[]> {
    try {
      const { stdout } = await this.runGitCommand(
        projectPath,
        'branch -a --format="%(refname:short)|%(objectname:short)|%(HEAD)"'
      );

      const branches: GitBranch[] = [];
      const lines = stdout.split('\n').filter((l) => l.trim());

      for (const line of lines) {
        const [name, lastCommit, head] = line.split('|');
        if (!name) continue;

        branches.push({
          name: name.trim(),
          isCurrent: head?.trim() === '*',
          isRemote: name.startsWith('origin/'),
          lastCommit: lastCommit?.trim(),
        });
      }

      return branches;
    } catch (error) {
      console.error('Failed to get branches:', error);
      return [];
    }
  }

  /**
   * Get recent commits
   */
  async getCommits(projectPath: string, limit: number = 10): Promise<GitCommit[]> {
    try {
      const { stdout } = await this.runGitCommand(
        projectPath,
        `log -${limit} --format="%H|%h|%s|%an|%ar"`
      );

      const commits: GitCommit[] = [];
      const lines = stdout.split('\n').filter((l) => l.trim());

      for (const line of lines) {
        const [hash, shortHash, message, author, date] = line.split('|');
        commits.push({
          hash: hash?.trim() || '',
          shortHash: shortHash?.trim() || '',
          message: message?.trim() || '',
          author: author?.trim() || '',
          date: date?.trim() || '',
        });
      }

      return commits;
    } catch (error) {
      console.error('Failed to get commits:', error);
      return [];
    }
  }

  /**
   * Stage files
   */
  async stage(
    projectPath: string,
    files?: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const fileArg = files && files.length > 0 ? files.map((f) => `"${f}"`).join(' ') : '-A';
      await this.runGitCommand(projectPath, `add ${fileArg}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Unstage files
   */
  async unstage(
    projectPath: string,
    files?: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const fileArg = files && files.length > 0 ? files.map((f) => `"${f}"`).join(' ') : '.';
      await this.runGitCommand(projectPath, `reset HEAD ${fileArg}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Create a commit
   */
  async commit(
    projectPath: string,
    options: GitCommitOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Stage files if specified
      if (options.files && options.files.length > 0) {
        await this.stage(projectPath, options.files);
      } else if (options.all) {
        await this.stage(projectPath);
      }

      // Escape message for shell
      const escapedMessage = options.message.replace(/"/g, '\\"');
      await this.runGitCommand(projectPath, `commit -m "${escapedMessage}"`);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Push to remote
   */
  async push(
    projectPath: string,
    options?: GitPushOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let command = 'push';
      if (options?.setUpstream) {
        command += ' -u';
      }
      if (options?.remote) {
        command += ` ${options.remote}`;
      }
      if (options?.branch) {
        command += ` ${options.branch}`;
      }
      await this.runGitCommand(projectPath, command);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Pull from remote
   */
  async pull(
    projectPath: string,
    options?: GitPullOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let command = 'pull';
      if (options?.rebase) {
        command += ' --rebase';
      }
      if (options?.remote) {
        command += ` ${options.remote}`;
      }
      if (options?.branch) {
        command += ` ${options.branch}`;
      }
      await this.runGitCommand(projectPath, command);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Checkout branch
   */
  async checkout(
    projectPath: string,
    branch: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.runGitCommand(projectPath, `checkout "${branch}"`);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Create new branch
   */
  async createBranch(
    projectPath: string,
    branchName: string,
    checkout: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const command = checkout
        ? `checkout -b "${branchName}"`
        : `branch "${branchName}"`;
      await this.runGitCommand(projectPath, command);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Initialize a new repository
   */
  async init(projectPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.runGitCommand(projectPath, 'init');
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Generate commit message from status
   */
  async generateCommitMessage(projectPath: string): Promise<string> {
    const status = await this.getStatus(projectPath);
    const changes: string[] = [];

    if (status.staged.length > 0) {
      const added = status.staged.filter((f) => f.status === 'added').length;
      const modified = status.staged.filter((f) => f.status === 'modified').length;
      const deleted = status.staged.filter((f) => f.status === 'deleted').length;

      if (added > 0) changes.push(`Add ${added} file${added > 1 ? 's' : ''}`);
      if (modified > 0) changes.push(`Update ${modified} file${modified > 1 ? 's' : ''}`);
      if (deleted > 0) changes.push(`Remove ${deleted} file${deleted > 1 ? 's' : ''}`);
    }

    if (status.untracked.length > 0 && status.staged.length === 0) {
      changes.push(`Add ${status.untracked.length} new file${status.untracked.length > 1 ? 's' : ''}`);
    }

    return changes.length > 0 ? changes.join(', ') : 'Update files';
  }
}
