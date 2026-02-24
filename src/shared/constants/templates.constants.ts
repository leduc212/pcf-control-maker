import type { ControlTemplate } from '../types/template.types';

export const BUILT_IN_TEMPLATES: ControlTemplate[] = [
  // Star Rating Control
  {
    id: 'star-rating',
    name: 'Star Rating',
    description: 'A customizable star rating control with support for half-stars, custom colors, and read-only mode. Perfect for feedback forms and reviews.',
    category: 'input',
    tags: ['rating', 'stars', 'feedback', 'input', 'form'],
    icon: 'Star24Regular',
    controlType: 'standard',
    namespace: 'Controls',
    properties: [
      {
        name: 'value',
        displayName: 'Rating Value',
        description: 'The current rating value (0-5)',
        ofType: 'Decimal',
        usage: 'bound',
        required: true,
      },
      {
        name: 'maxStars',
        displayName: 'Maximum Stars',
        description: 'The maximum number of stars to display',
        ofType: 'Whole.None',
        usage: 'input',
        required: false,
        defaultValue: '5',
      },
      {
        name: 'allowHalf',
        displayName: 'Allow Half Stars',
        description: 'Whether to allow half-star ratings',
        ofType: 'TwoOptions',
        usage: 'input',
        required: false,
        defaultValue: 'false',
      },
      {
        name: 'readOnly',
        displayName: 'Read Only',
        description: 'Whether the control is read-only',
        ofType: 'TwoOptions',
        usage: 'input',
        required: false,
        defaultValue: 'false',
      },
      {
        name: 'starColor',
        displayName: 'Star Color',
        description: 'The color of filled stars (CSS color value)',
        ofType: 'SingleLine.Text',
        usage: 'input',
        required: false,
        defaultValue: '#ffc107',
      },
      {
        name: 'emptyColor',
        displayName: 'Empty Star Color',
        description: 'The color of empty stars (CSS color value)',
        ofType: 'SingleLine.Text',
        usage: 'input',
        required: false,
        defaultValue: '#e0e0e0',
      },
      {
        name: 'size',
        displayName: 'Star Size',
        description: 'The size of stars in pixels',
        ofType: 'Whole.None',
        usage: 'input',
        required: false,
        defaultValue: '24',
      },
    ],
    resources: [
      { type: 'code', path: 'index.ts', order: 1 },
      { type: 'css', path: 'css/StarRating.css', order: 1 },
    ],
    featureUsage: {},
    platformLibraries: [],
    indexTs: `import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class StarRating implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container!: HTMLDivElement;
  private notifyOutputChanged!: () => void;
  private currentValue: number = 0;
  private maxStars: number = 5;
  private allowHalf: boolean = false;
  private readOnly: boolean = false;
  private starColor: string = "#ffc107";
  private emptyColor: string = "#e0e0e0";
  private size: number = 24;

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this.container = container;
    this.notifyOutputChanged = notifyOutputChanged;
    this.container.classList.add("star-rating-container");
    this.updateFromContext(context);
    this.render();
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this.updateFromContext(context);
    this.render();
  }

  private updateFromContext(context: ComponentFramework.Context<IInputs>): void {
    this.currentValue = context.parameters.value.raw ?? 0;
    this.maxStars = context.parameters.maxStars?.raw ?? 5;
    this.allowHalf = context.parameters.allowHalf?.raw === true;
    this.readOnly = context.parameters.readOnly?.raw === true || context.mode.isControlDisabled;
    this.starColor = context.parameters.starColor?.raw ?? "#ffc107";
    this.emptyColor = context.parameters.emptyColor?.raw ?? "#e0e0e0";
    this.size = context.parameters.size?.raw ?? 24;
  }

  private render(): void {
    this.container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "star-rating-wrapper";
    wrapper.style.setProperty("--star-size", \`\${this.size}px\`);
    wrapper.style.setProperty("--star-color", this.starColor);
    wrapper.style.setProperty("--empty-color", this.emptyColor);

    for (let i = 1; i <= this.maxStars; i++) {
      const star = this.createStar(i);
      wrapper.appendChild(star);
    }

    this.container.appendChild(wrapper);
  }

  private createStar(index: number): HTMLElement {
    const star = document.createElement("span");
    star.className = "star";

    const fillPercentage = this.getFillPercentage(index);
    star.innerHTML = this.getStarSvg(fillPercentage);

    if (!this.readOnly) {
      star.style.cursor = "pointer";
      star.addEventListener("click", (e) => this.handleClick(e, index));
      if (this.allowHalf) {
        star.addEventListener("mousemove", (e) => this.handleHover(e, star, index));
        star.addEventListener("mouseleave", () => this.render());
      }
    }

    return star;
  }

  private getFillPercentage(index: number): number {
    if (this.currentValue >= index) return 100;
    if (this.currentValue > index - 1) {
      return (this.currentValue - (index - 1)) * 100;
    }
    return 0;
  }

  private getStarSvg(fillPercentage: number): string {
    const id = \`star-\${Math.random().toString(36).substr(2, 9)}\`;
    return \`
      <svg width="\${this.size}" height="\${this.size}" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="\${id}">
            <stop offset="\${fillPercentage}%" stop-color="var(--star-color)" />
            <stop offset="\${fillPercentage}%" stop-color="var(--empty-color)" />
          </linearGradient>
        </defs>
        <path fill="url(#\${id})" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    \`;
  }

  private handleClick(event: MouseEvent, index: number): void {
    if (this.allowHalf) {
      const rect = (event.target as HTMLElement).closest('.star')!.getBoundingClientRect();
      const isLeftHalf = event.clientX - rect.left < rect.width / 2;
      this.currentValue = isLeftHalf ? index - 0.5 : index;
    } else {
      this.currentValue = index;
    }
    this.notifyOutputChanged();
    this.render();
  }

  private handleHover(event: MouseEvent, star: HTMLElement, index: number): void {
    const rect = star.getBoundingClientRect();
    const isLeftHalf = event.clientX - rect.left < rect.width / 2;
    const hoverValue = isLeftHalf ? index - 0.5 : index;

    // Temporarily show hover state
    const wrapper = this.container.querySelector('.star-rating-wrapper');
    if (wrapper) {
      const stars = wrapper.querySelectorAll('.star');
      stars.forEach((s, i) => {
        const fillPct = hoverValue >= i + 1 ? 100 : (hoverValue > i ? (hoverValue - i) * 100 : 0);
        s.innerHTML = this.getStarSvg(fillPct);
      });
    }
  }

  public getOutputs(): IOutputs {
    return { value: this.currentValue };
  }

  public destroy(): void {
    this.container.innerHTML = "";
  }
}
`,
    indexCss: `.star-rating-container {
  display: inline-block;
}

.star-rating-wrapper {
  display: flex;
  gap: 4px;
  align-items: center;
}

.star {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease;
}

.star:hover {
  transform: scale(1.1);
}

.star svg {
  display: block;
}
`,
    author: 'PCF Maker',
    version: '1.0.0',
    createdAt: Date.now(),
    isBuiltIn: true,
  },

  // Date Picker Control
  {
    id: 'date-picker',
    name: 'Enhanced Date Picker',
    description: 'A modern date picker with calendar popup, date range validation, format customization, and localization support.',
    category: 'input',
    tags: ['date', 'calendar', 'picker', 'input', 'form', 'datetime'],
    icon: 'Calendar24Regular',
    controlType: 'standard',
    namespace: 'Controls',
    properties: [
      {
        name: 'dateValue',
        displayName: 'Date Value',
        description: 'The selected date value',
        ofType: 'DateAndTime.DateOnly',
        usage: 'bound',
        required: true,
      },
      {
        name: 'minDate',
        displayName: 'Minimum Date',
        description: 'The minimum selectable date',
        ofType: 'DateAndTime.DateOnly',
        usage: 'input',
        required: false,
      },
      {
        name: 'maxDate',
        displayName: 'Maximum Date',
        description: 'The maximum selectable date',
        ofType: 'DateAndTime.DateOnly',
        usage: 'input',
        required: false,
      },
      {
        name: 'dateFormat',
        displayName: 'Date Format',
        description: 'Display format (e.g., MM/DD/YYYY, DD-MM-YYYY)',
        ofType: 'SingleLine.Text',
        usage: 'input',
        required: false,
        defaultValue: 'MM/DD/YYYY',
      },
      {
        name: 'placeholder',
        displayName: 'Placeholder',
        description: 'Placeholder text when no date is selected',
        ofType: 'SingleLine.Text',
        usage: 'input',
        required: false,
        defaultValue: 'Select a date...',
      },
      {
        name: 'showTodayButton',
        displayName: 'Show Today Button',
        description: 'Whether to show a "Today" button',
        ofType: 'TwoOptions',
        usage: 'input',
        required: false,
        defaultValue: 'true',
      },
      {
        name: 'showClearButton',
        displayName: 'Show Clear Button',
        description: 'Whether to show a clear button',
        ofType: 'TwoOptions',
        usage: 'input',
        required: false,
        defaultValue: 'true',
      },
    ],
    resources: [
      { type: 'code', path: 'index.ts', order: 1 },
      { type: 'css', path: 'css/DatePicker.css', order: 1 },
    ],
    featureUsage: {},
    platformLibraries: [],
    indexTs: `import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class DatePicker implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container!: HTMLDivElement;
  private notifyOutputChanged!: () => void;
  private currentDate: Date | null = null;
  private isOpen: boolean = false;
  private viewDate: Date = new Date();

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this.container = container;
    this.notifyOutputChanged = notifyOutputChanged;
    this.container.classList.add("date-picker-container");

    // Close calendar when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target as Node)) {
        this.isOpen = false;
        this.render(context);
      }
    });

    this.render(context);
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this.currentDate = context.parameters.dateValue.raw ?? null;
    this.render(context);
  }

  private render(context: ComponentFramework.Context<IInputs>): void {
    const placeholder = context.parameters.placeholder?.raw ?? "Select a date...";
    const showClear = context.parameters.showClearButton?.raw !== false;
    const disabled = context.mode.isControlDisabled;

    this.container.innerHTML = \`
      <div class="date-picker-input-wrapper">
        <input
          type="text"
          class="date-picker-input"
          readonly
          placeholder="\${placeholder}"
          value="\${this.currentDate ? this.formatDate(this.currentDate, context) : ''}"
          \${disabled ? 'disabled' : ''}
        />
        <div class="date-picker-icons">
          \${showClear && this.currentDate ? '<button class="clear-btn" title="Clear">&times;</button>' : ''}
          <button class="calendar-btn" title="Open calendar" \${disabled ? 'disabled' : ''}>📅</button>
        </div>
      </div>
      \${this.isOpen ? this.renderCalendar(context) : ''}
    \`;

    this.attachEventListeners(context);
  }

  private renderCalendar(context: ComponentFramework.Context<IInputs>): string {
    const showToday = context.parameters.showTodayButton?.raw !== false;
    const days = this.getCalendarDays();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    return \`
      <div class="date-picker-calendar">
        <div class="calendar-header">
          <button class="nav-btn prev-month">&lt;</button>
          <span class="month-year">\${monthNames[this.viewDate.getMonth()]} \${this.viewDate.getFullYear()}</span>
          <button class="nav-btn next-month">&gt;</button>
        </div>
        <div class="calendar-weekdays">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>
        <div class="calendar-days">
          \${days.map(day => \`
            <button
              class="day-btn \${day.isCurrentMonth ? '' : 'other-month'} \${day.isSelected ? 'selected' : ''} \${day.isToday ? 'today' : ''}"
              data-date="\${day.date.toISOString()}"
            >
              \${day.date.getDate()}
            </button>
          \`).join('')}
        </div>
        \${showToday ? '<button class="today-btn">Today</button>' : ''}
      </div>
    \`;
  }

  private getCalendarDays(): Array<{ date: Date; isCurrentMonth: boolean; isSelected: boolean; isToday: boolean }> {
    const days: Array<{ date: Date; isCurrentMonth: boolean; isSelected: boolean; isToday: boolean }> = [];
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add days from previous month
    for (let i = firstDay.getDay() - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false, isSelected: this.isSameDay(date, this.currentDate), isToday: this.isSameDay(date, today) });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true, isSelected: this.isSameDay(date, this.currentDate), isToday: this.isSameDay(date, today) });
    }

    // Add days from next month
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false, isSelected: this.isSameDay(date, this.currentDate), isToday: this.isSameDay(date, today) });
    }

    return days;
  }

  private isSameDay(d1: Date | null, d2: Date | null): boolean {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }

  private formatDate(date: Date, context: ComponentFramework.Context<IInputs>): string {
    const format = context.parameters.dateFormat?.raw ?? "MM/DD/YYYY";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', String(year));
  }

  private attachEventListeners(context: ComponentFramework.Context<IInputs>): void {
    const input = this.container.querySelector('.date-picker-input');
    const calendarBtn = this.container.querySelector('.calendar-btn');
    const clearBtn = this.container.querySelector('.clear-btn');
    const prevBtn = this.container.querySelector('.prev-month');
    const nextBtn = this.container.querySelector('.next-month');
    const todayBtn = this.container.querySelector('.today-btn');
    const dayBtns = this.container.querySelectorAll('.day-btn');

    input?.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.render(context);
    });

    calendarBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isOpen = !this.isOpen;
      this.render(context);
    });

    clearBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.currentDate = null;
      this.notifyOutputChanged();
      this.render(context);
    });

    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
      this.render(context);
    });

    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
      this.render(context);
    });

    todayBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.currentDate = new Date();
      this.currentDate.setHours(0, 0, 0, 0);
      this.isOpen = false;
      this.notifyOutputChanged();
      this.render(context);
    });

    dayBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dateStr = (btn as HTMLElement).dataset.date;
        if (dateStr) {
          this.currentDate = new Date(dateStr);
          this.isOpen = false;
          this.notifyOutputChanged();
          this.render(context);
        }
      });
    });
  }

  public getOutputs(): IOutputs {
    return { dateValue: this.currentDate ?? undefined };
  }

  public destroy(): void {
    this.container.innerHTML = "";
  }
}
`,
    indexCss: `.date-picker-container {
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.date-picker-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.date-picker-input {
  flex: 1;
  padding: 8px 12px;
  border: none;
  outline: none;
  font-size: 14px;
  cursor: pointer;
}

.date-picker-icons {
  display: flex;
  padding-right: 4px;
}

.date-picker-icons button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 16px;
  opacity: 0.7;
}

.date-picker-icons button:hover {
  opacity: 1;
}

.date-picker-calendar {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 12px;
  z-index: 1000;
  min-width: 280px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.month-year {
  font-weight: 600;
}

.nav-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-btn {
  aspect-ratio: 1;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 50%;
  font-size: 14px;
}

.day-btn:hover {
  background: #f0f0f0;
}

.day-btn.other-month {
  color: #ccc;
}

.day-btn.selected {
  background: #0078d4;
  color: white;
}

.day-btn.today {
  border: 2px solid #0078d4;
}

.today-btn {
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.today-btn:hover {
  background: #e5e5e5;
}
`,
    author: 'PCF Maker',
    version: '1.0.0',
    createdAt: Date.now(),
    isBuiltIn: true,
  },

  // File Upload Control
  {
    id: 'file-upload',
    name: 'File Upload',
    description: 'A drag-and-drop file upload control with progress indicator, file type validation, and preview support for images.',
    category: 'input',
    tags: ['file', 'upload', 'attachment', 'drag-drop', 'input'],
    icon: 'ArrowUpload24Regular',
    controlType: 'standard',
    namespace: 'Controls',
    properties: [
      {
        name: 'fileContent',
        displayName: 'File Content',
        description: 'Base64 encoded file content',
        ofType: 'Multiple',
        usage: 'bound',
        required: true,
      },
      {
        name: 'fileName',
        displayName: 'File Name',
        description: 'The name of the uploaded file',
        ofType: 'SingleLine.Text',
        usage: 'output',
        required: false,
      },
      {
        name: 'fileSize',
        displayName: 'File Size',
        description: 'The size of the uploaded file in bytes',
        ofType: 'Whole.None',
        usage: 'output',
        required: false,
      },
      {
        name: 'acceptedTypes',
        displayName: 'Accepted File Types',
        description: 'Comma-separated list of accepted MIME types or extensions (e.g., image/*,.pdf)',
        ofType: 'SingleLine.Text',
        usage: 'input',
        required: false,
        defaultValue: '*/*',
      },
      {
        name: 'maxSizeKb',
        displayName: 'Max File Size (KB)',
        description: 'Maximum file size in kilobytes',
        ofType: 'Whole.None',
        usage: 'input',
        required: false,
        defaultValue: '5120',
      },
      {
        name: 'showPreview',
        displayName: 'Show Image Preview',
        description: 'Whether to show preview for image files',
        ofType: 'TwoOptions',
        usage: 'input',
        required: false,
        defaultValue: 'true',
      },
    ],
    resources: [
      { type: 'code', path: 'index.ts', order: 1 },
      { type: 'css', path: 'css/FileUpload.css', order: 1 },
    ],
    featureUsage: {},
    platformLibraries: [],
    indexTs: `import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class FileUpload implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container!: HTMLDivElement;
  private notifyOutputChanged!: () => void;
  private fileContent: string | null = null;
  private fileName: string | null = null;
  private fileSize: number | null = null;

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this.container = container;
    this.notifyOutputChanged = notifyOutputChanged;
    this.container.classList.add("file-upload-container");
    this.render(context);
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this.render(context);
  }

  private render(context: ComponentFramework.Context<IInputs>): void {
    const acceptedTypes = context.parameters.acceptedTypes?.raw ?? "*/*";
    const maxSizeKb = context.parameters.maxSizeKb?.raw ?? 5120;
    const showPreview = context.parameters.showPreview?.raw !== false;
    const disabled = context.mode.isControlDisabled;

    const hasFile = this.fileName && this.fileContent;
    const isImage = hasFile && this.isImageFile(this.fileName!);

    this.container.innerHTML = \`
      <div class="file-upload-dropzone \${disabled ? 'disabled' : ''}" id="dropzone">
        \${hasFile ? \`
          <div class="file-preview">
            \${showPreview && isImage ? \`<img src="\${this.fileContent}" alt="Preview" class="image-preview" />\` : \`
              <div class="file-icon">📄</div>
            \`}
            <div class="file-info">
              <span class="file-name">\${this.fileName}</span>
              <span class="file-size">\${this.formatFileSize(this.fileSize!)}</span>
            </div>
            \${!disabled ? '<button class="remove-btn" title="Remove file">&times;</button>' : ''}
          </div>
        \` : \`
          <div class="upload-prompt">
            <div class="upload-icon">📁</div>
            <p>Drag & drop a file here</p>
            <p class="or-text">or</p>
            <label class="browse-btn">
              Browse Files
              <input type="file" accept="\${acceptedTypes}" style="display: none;" \${disabled ? 'disabled' : ''} />
            </label>
            <p class="file-hint">Max size: \${maxSizeKb >= 1024 ? (maxSizeKb / 1024).toFixed(1) + ' MB' : maxSizeKb + ' KB'}</p>
          </div>
        \`}
      </div>
      <div class="error-message" id="error-message"></div>
    \`;

    this.attachEventListeners(context);
  }

  private attachEventListeners(context: ComponentFramework.Context<IInputs>): void {
    const dropzone = this.container.querySelector('#dropzone') as HTMLElement;
    const fileInput = this.container.querySelector('input[type="file"]') as HTMLInputElement;
    const removeBtn = this.container.querySelector('.remove-btn');

    if (dropzone && !context.mode.isControlDisabled) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          this.handleFile(files[0], context);
        }
      });
    }

    fileInput?.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        this.handleFile(files[0], context);
      }
    });

    removeBtn?.addEventListener('click', () => {
      this.fileContent = null;
      this.fileName = null;
      this.fileSize = null;
      this.notifyOutputChanged();
      this.render(context);
    });
  }

  private handleFile(file: File, context: ComponentFramework.Context<IInputs>): void {
    const maxSizeKb = context.parameters.maxSizeKb?.raw ?? 5120;
    const errorEl = this.container.querySelector('#error-message') as HTMLElement;

    // Validate file size
    if (file.size > maxSizeKb * 1024) {
      errorEl.textContent = \`File too large. Maximum size is \${this.formatFileSize(maxSizeKb * 1024)}\`;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.fileContent = reader.result as string;
      this.fileName = file.name;
      this.fileSize = file.size;
      this.notifyOutputChanged();
      this.render(context);
    };
    reader.onerror = () => {
      errorEl.textContent = 'Error reading file';
    };
    reader.readAsDataURL(file);
  }

  private isImageFile(fileName: string): boolean {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '');
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  public getOutputs(): IOutputs {
    return {
      fileContent: this.fileContent ?? undefined,
      fileName: this.fileName ?? undefined,
      fileSize: this.fileSize ?? undefined,
    };
  }

  public destroy(): void {
    this.container.innerHTML = "";
  }
}
`,
    indexCss: `.file-upload-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.file-upload-dropzone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  transition: all 0.2s ease;
  background: #fafafa;
}

.file-upload-dropzone.dragover {
  border-color: #0078d4;
  background: #f0f7ff;
}

.file-upload-dropzone.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-prompt {
  color: #666;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.or-text {
  color: #999;
  margin: 8px 0;
}

.browse-btn {
  display: inline-block;
  padding: 8px 16px;
  background: #0078d4;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.browse-btn:hover {
  background: #106ebe;
}

.file-hint {
  font-size: 12px;
  color: #999;
  margin-top: 12px;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
}

.image-preview {
  max-width: 80px;
  max-height: 80px;
  border-radius: 4px;
  object-fit: cover;
}

.file-icon {
  font-size: 48px;
}

.file-info {
  flex: 1;
}

.file-name {
  display: block;
  font-weight: 500;
  word-break: break-all;
}

.file-size {
  display: block;
  font-size: 12px;
  color: #666;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 4px 8px;
}

.remove-btn:hover {
  color: #d32f2f;
}

.error-message {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 8px;
}
`,
    author: 'PCF Maker',
    version: '1.0.0',
    createdAt: Date.now(),
    isBuiltIn: true,
  },

  // Signature Pad Control
  {
    id: 'signature-pad',
    name: 'Signature Pad',
    description: 'A canvas-based signature capture control with touch support, pen thickness options, and export as image.',
    category: 'input',
    tags: ['signature', 'canvas', 'drawing', 'input', 'touch'],
    icon: 'Pen24Regular',
    controlType: 'standard',
    namespace: 'Controls',
    properties: [
      {
        name: 'signatureData',
        displayName: 'Signature Data',
        description: 'Base64 encoded signature image',
        ofType: 'Multiple',
        usage: 'bound',
        required: true,
      },
      {
        name: 'penColor',
        displayName: 'Pen Color',
        description: 'The color of the signature pen',
        ofType: 'SingleLine.Text',
        usage: 'input',
        required: false,
        defaultValue: '#000000',
      },
      {
        name: 'penWidth',
        displayName: 'Pen Width',
        description: 'The width of the signature pen in pixels',
        ofType: 'Whole.None',
        usage: 'input',
        required: false,
        defaultValue: '2',
      },
      {
        name: 'backgroundColor',
        displayName: 'Background Color',
        description: 'The background color of the signature pad',
        ofType: 'SingleLine.Text',
        usage: 'input',
        required: false,
        defaultValue: '#ffffff',
      },
      {
        name: 'height',
        displayName: 'Height',
        description: 'The height of the signature pad in pixels',
        ofType: 'Whole.None',
        usage: 'input',
        required: false,
        defaultValue: '200',
      },
    ],
    resources: [
      { type: 'code', path: 'index.ts', order: 1 },
      { type: 'css', path: 'css/SignaturePad.css', order: 1 },
    ],
    featureUsage: {},
    platformLibraries: [],
    indexTs: `import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class SignaturePad implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container!: HTMLDivElement;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private notifyOutputChanged!: () => void;
  private isDrawing: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private signatureData: string | null = null;

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this.container = container;
    this.notifyOutputChanged = notifyOutputChanged;
    this.container.classList.add("signature-pad-container");
    this.render(context);
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    // Only re-render if canvas doesn't exist
    if (!this.canvas) {
      this.render(context);
    }
  }

  private render(context: ComponentFramework.Context<IInputs>): void {
    const height = context.parameters.height?.raw ?? 200;
    const backgroundColor = context.parameters.backgroundColor?.raw ?? "#ffffff";
    const disabled = context.mode.isControlDisabled;

    this.container.innerHTML = \`
      <div class="signature-wrapper">
        <canvas
          id="signature-canvas"
          height="\${height}"
          style="background-color: \${backgroundColor};"
        ></canvas>
        <div class="signature-actions">
          <button class="clear-btn" \${disabled ? 'disabled' : ''}>Clear</button>
        </div>
      </div>
    \`;

    this.canvas = this.container.querySelector('#signature-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');

    // Set canvas width to container width
    this.canvas.width = this.container.clientWidth - 2; // Account for border

    // Load existing signature if any
    const existingData = context.parameters.signatureData.raw;
    if (existingData && this.ctx) {
      const img = new Image();
      img.onload = () => {
        this.ctx?.drawImage(img, 0, 0);
      };
      img.src = existingData;
    }

    this.attachEventListeners(context);
  }

  private attachEventListeners(context: ComponentFramework.Context<IInputs>): void {
    if (!this.canvas || context.mode.isControlDisabled) return;

    const penColor = context.parameters.penColor?.raw ?? "#000000";
    const penWidth = context.parameters.penWidth?.raw ?? 2;

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e, penColor, penWidth));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrawing(touch);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.draw(touch, penColor, penWidth);
    });
    this.canvas.addEventListener('touchend', () => this.stopDrawing());

    // Clear button
    const clearBtn = this.container.querySelector('.clear-btn');
    clearBtn?.addEventListener('click', () => this.clear(context));
  }

  private startDrawing(e: MouseEvent | Touch): void {
    this.isDrawing = true;
    const rect = this.canvas!.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
  }

  private draw(e: MouseEvent | Touch, color: string, width: number): void {
    if (!this.isDrawing || !this.ctx || !this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  private stopDrawing(): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.saveSignature();
    }
  }

  private saveSignature(): void {
    if (this.canvas) {
      this.signatureData = this.canvas.toDataURL('image/png');
      this.notifyOutputChanged();
    }
  }

  private clear(context: ComponentFramework.Context<IInputs>): void {
    if (this.ctx && this.canvas) {
      const backgroundColor = context.parameters.backgroundColor?.raw ?? "#ffffff";
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.signatureData = null;
      this.notifyOutputChanged();
    }
  }

  public getOutputs(): IOutputs {
    return { signatureData: this.signatureData ?? undefined };
  }

  public destroy(): void {
    this.container.innerHTML = "";
  }
}
`,
    indexCss: `.signature-pad-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.signature-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

#signature-canvas {
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: crosshair;
  touch-action: none;
  width: 100%;
}

.signature-actions {
  display: flex;
  justify-content: flex-end;
}

.clear-btn {
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.clear-btn:hover:not(:disabled) {
  background: #e5e5e5;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`,
    author: 'PCF Maker',
    version: '1.0.0',
    createdAt: Date.now(),
    isBuiltIn: true,
  },

  // QR Code Generator
  {
    id: 'qr-code',
    name: 'QR Code Generator',
    description: 'Generate QR codes from text or URLs with customizable size, colors, and error correction levels.',
    category: 'display',
    tags: ['qr', 'code', 'barcode', 'generator', 'display'],
    icon: 'QrCode24Regular',
    controlType: 'standard',
    namespace: 'Controls',
    properties: [
      {
        name: 'value',
        displayName: 'Value',
        description: 'The text or URL to encode in the QR code',
        ofType: 'SingleLine.Text',
        usage: 'bound',
        required: true,
      },
      {
        name: 'size',
        displayName: 'Size',
        description: 'The size of the QR code in pixels',
        ofType: 'Whole.None',
        usage: 'input',
        required: false,
        defaultValue: '200',
      },
      {
        name: 'foregroundColor',
        displayName: 'Foreground Color',
        description: 'The color of the QR code modules',
        ofType: 'SingleLine.Text',
        usage: 'input',
        required: false,
        defaultValue: '#000000',
      },
      {
        name: 'backgroundColor',
        displayName: 'Background Color',
        description: 'The background color of the QR code',
        ofType: 'SingleLine.Text',
        usage: 'input',
        required: false,
        defaultValue: '#ffffff',
      },
      {
        name: 'errorCorrectionLevel',
        displayName: 'Error Correction Level',
        description: 'Error correction level (L=7%, M=15%, Q=25%, H=30%)',
        ofType: 'SingleLine.Text',
        usage: 'input',
        required: false,
        defaultValue: 'M',
      },
    ],
    resources: [
      { type: 'code', path: 'index.ts', order: 1 },
      { type: 'css', path: 'css/QRCode.css', order: 1 },
    ],
    featureUsage: {},
    platformLibraries: [],
    indexTs: `import { IInputs, IOutputs } from "./generated/ManifestTypes";

// Simplified QR Code generator (for full functionality, use a library like qrcode.js)
export class QRCode implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container!: HTMLDivElement;

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this.container = container;
    this.container.classList.add("qr-code-container");
    this.render(context);
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this.render(context);
  }

  private render(context: ComponentFramework.Context<IInputs>): void {
    const value = context.parameters.value.raw ?? "";
    const size = context.parameters.size?.raw ?? 200;
    const fgColor = context.parameters.foregroundColor?.raw ?? "#000000";
    const bgColor = context.parameters.backgroundColor?.raw ?? "#ffffff";
    const ecLevel = context.parameters.errorCorrectionLevel?.raw ?? "M";

    if (!value) {
      this.container.innerHTML = \`
        <div class="qr-placeholder" style="width: \${size}px; height: \${size}px;">
          <span>Enter a value to generate QR code</span>
        </div>
      \`;
      return;
    }

    // Using Google Charts API for QR generation (replace with local library in production)
    const encodedValue = encodeURIComponent(value);
    const qrUrl = \`https://chart.googleapis.com/chart?cht=qr&chs=\${size}x\${size}&chl=\${encodedValue}&chco=\${fgColor.replace('#', '')}&chf=bg,s,\${bgColor.replace('#', '')}&chld=\${ecLevel}\`;

    this.container.innerHTML = \`
      <div class="qr-wrapper">
        <img
          src="\${qrUrl}"
          alt="QR Code for: \${value}"
          width="\${size}"
          height="\${size}"
          class="qr-image"
        />
        <div class="qr-actions">
          <button class="download-btn" title="Download QR Code">Download</button>
        </div>
      </div>
    \`;

    // Download button
    const downloadBtn = this.container.querySelector('.download-btn');
    downloadBtn?.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = 'qrcode.png';
      link.click();
    });
  }

  public getOutputs(): IOutputs {
    return {};
  }

  public destroy(): void {
    this.container.innerHTML = "";
  }
}
`,
    indexCss: `.qr-code-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.qr-wrapper {
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
}

.qr-image {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.qr-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 2px dashed #ccc;
  border-radius: 4px;
  color: #999;
  text-align: center;
  padding: 16px;
}

.qr-actions {
  display: flex;
  justify-content: center;
}

.download-btn {
  padding: 6px 12px;
  background: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.download-btn:hover {
  background: #106ebe;
}
`,
    author: 'PCF Maker',
    version: '1.0.0',
    createdAt: Date.now(),
    isBuiltIn: true,
  },

  // Rich Text Editor
  {
    id: 'rich-text-editor',
    name: 'Rich Text Editor',
    description: 'A full-featured rich text editor with formatting toolbar, HTML output, and support for lists, links, and more.',
    category: 'input',
    tags: ['rich-text', 'editor', 'wysiwyg', 'html', 'formatting'],
    icon: 'TextEditStyle24Regular',
    controlType: 'standard',
    namespace: 'Controls',
    properties: [
      {
        name: 'htmlContent',
        displayName: 'HTML Content',
        description: 'The HTML content of the editor',
        ofType: 'Multiple',
        usage: 'bound',
        required: true,
      },
      {
        name: 'plainText',
        displayName: 'Plain Text',
        description: 'The plain text content (read-only output)',
        ofType: 'Multiple',
        usage: 'output',
        required: false,
      },
      {
        name: 'placeholder',
        displayName: 'Placeholder',
        description: 'Placeholder text when empty',
        ofType: 'SingleLine.Text',
        usage: 'input',
        required: false,
        defaultValue: 'Start typing...',
      },
      {
        name: 'height',
        displayName: 'Height',
        description: 'Editor height in pixels',
        ofType: 'Whole.None',
        usage: 'input',
        required: false,
        defaultValue: '300',
      },
      {
        name: 'showToolbar',
        displayName: 'Show Toolbar',
        description: 'Whether to show the formatting toolbar',
        ofType: 'TwoOptions',
        usage: 'input',
        required: false,
        defaultValue: 'true',
      },
    ],
    resources: [
      { type: 'code', path: 'index.ts', order: 1 },
      { type: 'css', path: 'css/RichTextEditor.css', order: 1 },
    ],
    featureUsage: {},
    platformLibraries: [],
    indexTs: `import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class RichTextEditor implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container!: HTMLDivElement;
  private editor: HTMLDivElement | null = null;
  private notifyOutputChanged!: () => void;
  private htmlContent: string = "";
  private plainText: string = "";

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this.container = container;
    this.notifyOutputChanged = notifyOutputChanged;
    this.container.classList.add("rich-text-container");
    this.render(context);
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    // Don't re-render if editor has focus (user is typing)
    if (this.editor && document.activeElement === this.editor) {
      return;
    }

    const newContent = context.parameters.htmlContent.raw ?? "";
    if (this.editor && newContent !== this.htmlContent) {
      this.editor.innerHTML = newContent;
      this.htmlContent = newContent;
    }
  }

  private render(context: ComponentFramework.Context<IInputs>): void {
    const height = context.parameters.height?.raw ?? 300;
    const showToolbar = context.parameters.showToolbar?.raw !== false;
    const placeholder = context.parameters.placeholder?.raw ?? "Start typing...";
    const disabled = context.mode.isControlDisabled;
    const initialContent = context.parameters.htmlContent.raw ?? "";

    this.container.innerHTML = \`
      \${showToolbar && !disabled ? \`
        <div class="rte-toolbar">
          <button data-cmd="bold" title="Bold"><b>B</b></button>
          <button data-cmd="italic" title="Italic"><i>I</i></button>
          <button data-cmd="underline" title="Underline"><u>U</u></button>
          <span class="separator"></span>
          <button data-cmd="insertUnorderedList" title="Bullet List">• List</button>
          <button data-cmd="insertOrderedList" title="Numbered List">1. List</button>
          <span class="separator"></span>
          <button data-cmd="createLink" title="Insert Link">🔗</button>
          <button data-cmd="removeFormat" title="Clear Formatting">✕</button>
        </div>
      \` : ''}
      <div
        class="rte-editor"
        contenteditable="\${!disabled}"
        style="min-height: \${height}px;"
        data-placeholder="\${placeholder}"
      >\${initialContent}</div>
    \`;

    this.editor = this.container.querySelector('.rte-editor') as HTMLDivElement;
    this.htmlContent = initialContent;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Toolbar buttons
    const buttons = this.container.querySelectorAll('.rte-toolbar button');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = (btn as HTMLElement).dataset.cmd;
        if (cmd === 'createLink') {
          const url = prompt('Enter URL:');
          if (url) {
            document.execCommand(cmd, false, url);
          }
        } else if (cmd) {
          document.execCommand(cmd, false);
        }
        this.editor?.focus();
        this.updateContent();
      });
    });

    // Editor input
    this.editor?.addEventListener('input', () => this.updateContent());
    this.editor?.addEventListener('blur', () => this.updateContent());
  }

  private updateContent(): void {
    if (this.editor) {
      this.htmlContent = this.editor.innerHTML;
      this.plainText = this.editor.textContent ?? "";
      this.notifyOutputChanged();
    }
  }

  public getOutputs(): IOutputs {
    return {
      htmlContent: this.htmlContent,
      plainText: this.plainText,
    };
  }

  public destroy(): void {
    this.container.innerHTML = "";
  }
}
`,
    indexCss: `.rich-text-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.rte-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #f5f5f5;
  border-bottom: 1px solid #ccc;
  flex-wrap: wrap;
}

.rte-toolbar button {
  padding: 4px 8px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  min-width: 32px;
}

.rte-toolbar button:hover {
  background: #e5e5e5;
}

.rte-toolbar .separator {
  width: 1px;
  background: #ddd;
  margin: 0 4px;
}

.rte-editor {
  padding: 12px;
  outline: none;
  overflow-y: auto;
}

.rte-editor:empty:before {
  content: attr(data-placeholder);
  color: #999;
  pointer-events: none;
}

.rte-editor:focus {
  background: #fafafa;
}

.rte-editor ul, .rte-editor ol {
  margin: 8px 0;
  padding-left: 24px;
}

.rte-editor a {
  color: #0078d4;
}
`,
    author: 'PCF Maker',
    version: '1.0.0',
    createdAt: Date.now(),
    isBuiltIn: true,
  },
];

export const TEMPLATE_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'All Templates', icon: 'Grid24Regular' },
  { id: 'input', label: 'Input Controls', icon: 'TextEditStyle24Regular' },
  { id: 'display', label: 'Display Controls', icon: 'Eye24Regular' },
  { id: 'media', label: 'Media Controls', icon: 'Image24Regular' },
  { id: 'data', label: 'Data Controls', icon: 'Database24Regular' },
  { id: 'utility', label: 'Utility Controls', icon: 'Wrench24Regular' },
  { id: 'custom', label: 'Custom Templates', icon: 'PersonCircle24Regular' },
];
