import { svg, TemplateResult } from 'lit';

export const arrowLeft = svg`
  <line class="icon arrow-left" x1="19" y1="12" x2="5" y2="12"></line>
  <polyline class="icon arrow-left" points="12 19 5 12 12 5"></polyline>
`;

export const arrowRight = svg`
  <line class="icon arrow-right" x1="5" y1="12" x2="19" y2="12"></line>
  <polyline class="icon arrow-right" points="12 5 19 12 12 19"></polyline>
`;

export const calendar = svg`
  <rect class="icon calendar" x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
  <line class="icon calendar" x1="16" y1="2" x2="16" y2="6"></line>
  <line class="icon calendar" x1="8" y1="2" x2="8" y2="6"></line>
  <line class="icon calendar" x1="3" y1="10" x2="21" y2="10"></line>
`;

export const check = svg`
  <path class="icon check" d="M6 12l4 4 8-8" stroke-linecap="round" stroke-linejoin="round" pathLength="100" />
`;

export const chevronDown = svg`
  <path class="icon chevron-down" d="M6 9l6 6 6-6" />
`;

export const chevronLeft = svg`
  <path class="icon chevron-left" d="M15 18l-6-6 6-6"/>
`;

export const chevronRight = svg`
  <path class="icon chevron-right" d="M9 18l6-6-6-6"/>
`;

export const chevronUp = svg`
  <path class="icon chevron-up" d="M18 15l-6-6-6 6"/>
`;

export const close = svg`
  <line 
    class="icon close top-left" 
    x1="4" y1="4" x2="20" y2="20" 
    stroke-linecap="round" 
    pathLength="100" 
  /><line 
    class="icon close top-right" 
    x1="20" y1="4" x2="4" y2="20" 
    stroke-linecap="round" 
    pathLength="100"
  />
`;

export const columns = svg`
  <path class="icon columns" d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
`;

export const contract = svg`
  <path class="icon contract" d="M8 3v5H3" />
  <path class="icon contract" d="M16 3v5h5" />
  <path class="icon contract" d="M16 21v-5h5" />
  <path class="icon contract" d="M8 21v-5H3" />
`;

export const copy = svg`
  <rect class="icon copy" x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
  <path class="icon copy" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
`;

export const download = svg`
  <path class="icon download" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline class="icon download" points="7 10 12 15 17 10" />
  <line class="icon download" x1="12" y1="15" x2="12" y2="3" />
`;

export const expand = svg`
  <path class="icon expand" d="M3 8V3h5" />
  <path class="icon expand" d="M21 8V3h-5" />
  <path class="icon expand" d="M21 16v5h-5" />
  <path class="icon expand" d="M3 16v5h5" />
`;

export const eye = svg`
  <path class="icon eye" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
  <circle class="icon eye" cx="12" cy="12" r="3"></circle>
`;

export const eyeSlash = svg`
  <path class="icon eye-slash" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
  <path class="icon eye-slash" d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
  <path class="icon eye-slash" d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>
  <line class="icon eye-slash" x1="1" y1="1" x2="23" y2="23"></line>
`;

export const filters = svg`
  <polygon class="icon filters" points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
`;

export const grabber = svg`
  <circle class="icon grabber" cx="9" cy="12" r="1" />
  <circle class="icon grabber" cx="9" cy="5" r="1" />
  <circle class="icon grabber" cx="9" cy="19" r="1" />
  <circle class="icon grabber" cx="15" cy="12" r="1" />
  <circle class="icon grabber" cx="15" cy="5" r="1" />
  <circle class="icon grabber" cx="15" cy="19" r="1" />
`;

export const link = svg`
  <path class="icon link" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
  <path class="icon link" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
`;

export const listFlat = svg`
  <path class="icon list-flat" d="M4 6h16"/>
  <path class="icon list-flat" d="M10 12h10"/>
  <path class="icon list-flat" d="M10 18h10"/>
  <path class="icon list-flat" d="M6 6v12"/>
  <path class="icon list-flat" d="M6 12h2"/>
  <path class="icon list-flat" d="M6 18h2"/>
`;

export const listNested = svg`
  <path class="icon list-nested" d="M4 6h16"/>
  <path class="icon list-nested" d="M10 12h10"/>
  <path class="icon list-nested" d="M16 18h4"/>
  <path class="icon list-nested" d="M6 6v6"/>
  <path class="icon list-nested" d="M6 12h2"/>
  <path class="icon list-nested" d="M12 12v6"/>
  <path class="icon list-nested" d="M12 18h2"/>
`;

export const moon = svg`
  <path class="icon moon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
`;

export const nodeDeep = svg`
  <rect class="icon node-deep" x="10" y="2" width="4" height="4" rx="1"/>
  <path class="icon node-deep" d="M12 6v2"/>
  <path class="icon node-deep" d="M6 8h10"/>
  <path class="icon node-deep" d="M6 8v2"/>
  <path class="icon node-deep" d="M16 8v2"/>
  <rect class="icon node-deep" x="4" y="10" width="4" height="4" rx="1"/>
  <rect class="icon node-deep" x="14" y="10" width="4" height="4" rx="1"/>
  <path class="icon node-deep" d="M16 14v2"/>
  <path class="icon node-deep" d="M12 16h8"/>
  <path class="icon node-deep" d="M12 16v2"/>
  <path class="icon node-deep" d="M20 16v2"/>
  <rect class="icon node-deep" x="10" y="18" width="4" height="4" rx="1"/>
  <rect class="icon node-deep" x="18" y="18" width="4" height="4" rx="1"/>
`;

export const nodeShallow = svg`
  <rect class="icon node-shallow" x="10" y="2" width="4" height="4" rx="1"/>
  <path class="icon node-shallow" d="M12 6v3"/>
  <path class="icon node-shallow" d="M5 9h14"/>
  <path class="icon node-shallow" d="M5 9v3"/>
  <path class="icon node-shallow" d="M12 9v3"/>
  <path class="icon node-shallow" d="M19 9v3"/>
  <rect class="icon node-shallow" x="3" y="12" width="4" height="4" rx="1"/>
  <rect class="icon node-shallow" x="10" y="12" width="4" height="4" rx="1"/>
  <rect class="icon node-shallow" x="17" y="12" width="4" height="4" rx="1"/>
`;

export const pencil = svg`
  <path class="icon pencil" d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
`;

export const pencilPaper = svg`
  <path class="icon pencil-paper" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
  <path class="icon pencil-paper" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
`;

export const print = svg`
  <polyline class="icon print" points="6 9 6 2 18 2 18 9"></polyline>
  <path class="icon print" d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
  <rect class="icon print" x="6" y="14" width="12" height="8"></rect>
`;

export const qrCode = svg`
  <!-- Top Left Square -->
  <rect class="icon qr-code" width="5" height="5" x="3" y="3" rx="1" />
  <!-- Top Right Square -->
  <rect class="icon qr-code" width="5" height="5" x="16" y="3" rx="1" />
  <!-- Bottom Left Square -->
  <rect class="icon qr-code" width="5" height="5" x="3" y="16" rx="1" />
  <!-- Center and Bottom Right Data Modules -->
  <path class="icon qr-code" d="M21 16h-3a2 2 0 0 0-2 2v3" />
  <path class="icon qr-code" d="M21 21v.01" />
  <path class="icon qr-code" d="M12 7v3a2 2 0 0 1-2 2H7" />
  <path class="icon qr-code" d="M3 12h.01" />
  <path class="icon qr-code" d="M12 3h.01" />
  <path class="icon qr-code" d="M12 16v.01" />
  <path class="icon qr-code" d="M16 12h1" />
  <path class="icon qr-code" d="M21 12v.01" />
  <path class="icon qr-code" d="M12 21v-1" />
`;

export const reload = svg`
  <path class="icon reload" d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
  <path class="icon reload" d="M21 3v5h-5" />
`;

export const save = svg`
  <path class="icon save" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
  <polyline class="icon save" points="17 21 17 13 7 13 7 21"/>
  <polyline class="icon save" points="7 3 7 8 15 8"/>
`;

export const scan = svg`
  <path class="icon scan" d="M4 9V5a1 1 0 0 1 1-1h4" />
  <path class="icon scan" d="M15 4h4a1 1 0 0 1 1 1v4" />
  <path class="icon scan" d="M4 15v4a1 1 0 0 0 1 1h4" />
  <path class="icon scan" d="M15 20h4a1 1 0 0 0 1-1v-4" />
  <line class="icon scan" x1="3" y1="12" x2="21" y2="12" />
`;

export const searchPriority = svg`
  <circle class="icon search-priority" cx="10" cy="10" r="7"></circle>
  <line class="icon search-priority" x1="21" y1="21" x2="15.2" y2="15.2"></line>
  <path class="icon search-priority" d="M10 5l1 4 4 1-4 1-1 4-1-4-4-1 4-1z" fill="currentColor" stroke="none"></path>
`;

export const share = svg`
  <circle class="icon share" cx="18" cy="5" r="3" />
  <circle class="icon share" cx="6" cy="12" r="3" />
  <circle class="icon share" cx="18" cy="19" r="3" />

  <line class="icon share" x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
  <line class="icon share" x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
`;

export const sortPriority = svg`
  <path class="icon sort-priority" d="M3 6h6"></path>
  <path class="icon sort-priority" d="M3 12h9"></path>
  <path class="icon sort-priority" d="M3 18h12"></path>
  <path class="icon sort-priority" d="M18 4v14"></path>
  <path class="icon sort-priority" d="M22 14l-4 4-4-4"></path>
`;

export const spinner = svg`
  <circle class="icon spinner track" cx="12" cy="12" r="10"></circle>
  <circle class="icon spinner indicator" cx="12" cy="12" r="10" stroke-linecap="round" pathLength="100" ></circle>
`;

export const sun = svg`
  <circle class="icon sun circle" cx="12" cy="12" r="5" />
  <path class="icon sun rays" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
`;

export const sumMoon = svg`
  <line class="icon sun-moon" x1="12" y1="2" x2="12" y2="4" />
  <line class="icon sun-moon" x1="12" y1="20" x2="12" y2="22" />
  
  <line class="icon sun-moon" x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
  <line class="icon sun-moon" x1="2" y1="12" x2="4" y2="12" />
  <line class="icon sun-moon" x1="4.93" y1="19.07" x2="6.34" y2="17.66" />

  <path class="icon sun-moon" d="M12 18 a 6 6 0 0 1 0 -12" />

  <path class="icon sun-moon" d="M12 6 a 6 6 0 0 1 0 12 a 8 8 0 0 0 0 -12 z" fill="currentColor" stroke="none" />
`;

export const trash = svg`
  <path class="icon trash" d="M3 6h18" />
  <path class="icon trash" d="M19 6v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6" />
  <path class="icon trash" d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" />
  <line class="icon trash" x1="10" y1="11" x2="10" y2="17" />
  <line class="icon trash" x1="14" y1="11" x2="14" y2="17" />
`;

/**
 * The icon set used by `<yatl-icon>`, keyed by icon name. Use
 * {@link registerIcon} or {@link registerIcons} to add to it rather than
 * mutating it directly.
 */
export const icons: Record<string, TemplateResult<2>> = {
  'arrow-left': arrowLeft,
  'arrow-right': arrowRight,
  calendar: calendar,
  check: check,
  'chevron-down': chevronDown,
  'chevron-left': chevronLeft,
  'chevron-right': chevronRight,
  'chevron-up': chevronUp,
  close: close,
  columns: columns,
  contract: contract,
  copy: copy,
  download: download,
  expand: expand,
  eye: eye,
  'eye-slash': eyeSlash,
  filters: filters,
  grabber: grabber,
  link: link,
  'list-flat': listFlat,
  'list-nested': listNested,
  moon: moon,
  'node-deep': nodeDeep,
  'node-shallow': nodeShallow,
  pencil: pencil,
  'pencil-paper': pencilPaper,
  print: print,
  'qr-code': qrCode,
  reload: reload,
  save: save,
  scan: scan,
  'search-priority': searchPriority,
  share: share,
  'sort-priority': sortPriority,
  spinner: spinner,
  sun: sun,
  'sun-moon': sumMoon,
  trash: trash,
};

/**
 * Registers a custom icon so it can be used anywhere via
 * `<yatl-icon name="...">`. Registering a name that already exists
 * (including a built-in icon) replaces it.
 *
 * Icons are typically authored on a 24x24 grid using `stroke="currentColor"`
 * shapes (matching the built-in set), but any valid SVG content works —
 * set the `view-box` attribute on `<yatl-icon>` if yours uses a different
 * coordinate system.
 *
 * @example
 * ```ts
 * import { registerIcon, svg } from '@timlassiter11/yatl-ui';
 *
 * registerIcon('my-custom-icon', svg`<path d="M12 2 2 22h20z" />`);
 * ```
 */
export function registerIcon(name: string, icon: TemplateResult<2>) {
  icons[name] = icon;
}

/**
 * Registers multiple custom icons at once. See {@link registerIcon}.
 */
export function registerIcons(newIcons: Record<string, TemplateResult<2>>) {
  Object.assign(icons, newIcons);
}
