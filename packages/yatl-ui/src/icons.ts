import { svg, TemplateResult } from 'lit';

export const sunIcon = svg`
  <circle cx="12" cy="12" r="5" />
  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
`;

export const moonIcon = svg`
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
`;

export const trashIcon = svg`
  <path d="M3 6h18" />
  <path d="M19 6v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6" />
  <path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" />
  <line x1="10" y1="11" x2="10" y2="17" />
  <line x1="14" y1="11" x2="14" y2="17" />
`;

export const closeIcon = svg`
  <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
`;

export const chevronDownIcon = svg`
  <path d="M6 9l6 6 6-6" />
`;

export const checkIcon = svg`
  <path fill="currentColor" d="M18.7,7.2c-0.4-0.4-1-0.4-1.4,0l-7.5,7.5l-3.1-3.1c0,0,0,0,0,0c-0.4-0.4-1-0.4-1.4,0c-0.4,0.4-0.4,1,0,1.4l3.8,3.8c0.2,0.2,0.4,0.3,0.7,0.3c0.3,0,0.5-0.1,0.7-0.3l8.2-8.2C19.1,8.2,19.1,7.6,18.7,7.2z"/>
`;

export const columnsIcon = svg`
  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
`;

export const downloadIcon = svg`
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline points="7 10 12 15 17 10" />
  <line x1="12" y1="15" x2="12" y2="3" />
`;

export const spinnerIcon = svg`
  <circle part="track" cx="12" cy="12" r="10"></circle>
  <circle part="indicator" cx="12" cy="12" r="10" stroke-linecap="round" pathLength="100" ></circle>
`;

export const icons: Record<string, TemplateResult<2>> = {
  sun: sunIcon,
  moon: moonIcon,
  trash: trashIcon,
  close: closeIcon,
  'chevron-down': chevronDownIcon,
  check: checkIcon,
  columns: columnsIcon,
  download: downloadIcon,
  spinner: spinnerIcon,
};
