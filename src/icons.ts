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
  <path d="M18 6L6 18M6 6l12 12" stroke-linecap="square" stroke-linejoin="round" />
`;

export const chevronDownIcon = svg`
  <path d="M6 9l6 6 6-6" />
`;

export const checkIcon = svg`
  <path fill="currentColor" d="M13.485 1.929l-8.485 8.485-3.536-3.536-1.414 1.414 4.95 4.95 9.9-9.9z"/>
`;

export const columnsIcon = svg`
  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
`;

export const downloadIcon = svg`
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline points="7 10 12 15 17 10" />
  <line x1="12" y1="15" x2="12" y2="3" />
`;

export const icons: Record<string, TemplateResult<2>> = {
  'sun': sunIcon,
  'moon': moonIcon,
  'trash': trashIcon,
  'close': closeIcon,
  'chevron-down': chevronDownIcon,
  'check': checkIcon,
  'columns': columnsIcon,
  'download': downloadIcon
};
