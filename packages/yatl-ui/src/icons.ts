import { svg, TemplateResult } from 'lit';

export const sunIcon = svg`
  <circle class="icon sun circle" cx="12" cy="12" r="5" />
  <path class="icon sun rays" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
`;

export const moonIcon = svg`
  <path class="icon moon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
`;

export const sunMoonIcon = svg`
  <line class="icon sun-moon" x1="12" y1="2" x2="12" y2="4" />
  <line class="icon sun-moon" x1="12" y1="20" x2="12" y2="22" />
  
  <line class="icon sun-moon" x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
  <line class="icon sun-moon" x1="2" y1="12" x2="4" y2="12" />
  <line class="icon sun-moon" x1="4.93" y1="19.07" x2="6.34" y2="17.66" />

  <path class="icon sun-moon" d="M12 18 a 6 6 0 0 1 0 -12" />

  <path class="icon sun-moon" d="M12 6 a 6 6 0 0 1 0 12 a 8 8 0 0 0 0 -12 z" fill="currentColor" stroke="none" />
`;

export const trashIcon = svg`
  <path class="icon trash" d="M3 6h18" />
  <path class="icon trash" d="M19 6v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6" />
  <path class="icon trash" d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" />
  <line class="icon trash" x1="10" y1="11" x2="10" y2="17" />
  <line class="icon trash" x1="14" y1="11" x2="14" y2="17" />
`;

export const closeIcon = svg`
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

export const chevronDownIcon = svg`
  <path class="icon chevron-down" d="M6 9l6 6 6-6" />
`;

export const checkIcon = svg`
  <path class="icon check" d="M6 12l4 4 8-8" stroke-linecap="round" stroke-linejoin="round" pathLength="100" />
`;

export const columnsIcon = svg`
  <path class="icon columns" d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
`;

export const downloadIcon = svg`
  <path class="icon download" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline class="icon download" points="7 10 12 15 17 10" />
  <line class="icon download" x1="12" y1="15" x2="12" y2="3" />
`;

export const reloadIcon = svg`
  <path class="icon reload" d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
  <path class="icon reload" d="M21 3v5h-5" />
`;

export const spinnerIcon = svg`
  <circle class="icon spinner track" cx="12" cy="12" r="10"></circle>
  <circle class="icon spinner indicator" cx="12" cy="12" r="10" stroke-linecap="round" pathLength="100" ></circle>
`;

export const expandIcon = svg`
  <path class="icon expand" d="M3 8V3h5" />
  <path class="icon expand" d="M21 8V3h-5" />
  <path class="icon expand" d="M21 16v5h-5" />
  <path class="icon expand" d="M3 16v5h5" />
`;

export const contractIcon = svg`
  <path class="icon contract" d="M8 3v5H3" />
  <path class="icon contract" d="M16 3v5h5" />
  <path class="icon contract" d="M16 21v-5h5" />
  <path class="icon contract" d="M8 21v-5H3" />
`;

export const shareIcon = svg`
  <circle class="icon share" cx="18" cy="5" r="3" />
  <circle class="icon share" cx="6" cy="12" r="3" />
  <circle class="icon share" cx="18" cy="19" r="3" />
  
  <line class="icon share" x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
  <line class="icon share" x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
`;

export const linkIcon = svg`
  <path class="icon link" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
  <path class="icon link" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
`;

export const leftArrow = svg`
  <line class="icon left-arrow" x1="19" y1="12" x2="5" y2="12"></line>
  <polyline class="icon left-arrow" points="12 19 5 12 12 5"></polyline>
`;

export const rightArrow = svg`
  <line class="icon right-arrow" x1="5" y1="12" x2="19" y2="12"></line>
  <polyline class="icon right-arrow" points="12 5 19 12 12 19"></polyline>
`;

export const icons: Record<string, TemplateResult<2>> = {
  expand: expandIcon,
  contract: contractIcon,
  sun: sunIcon,
  moon: moonIcon,
  'sun-moon': sunMoonIcon,
  trash: trashIcon,
  close: closeIcon,
  'chevron-down': chevronDownIcon,
  check: checkIcon,
  columns: columnsIcon,
  download: downloadIcon,
  reload: reloadIcon,
  spinner: spinnerIcon,
  share: shareIcon,
  link: linkIcon,
  'left-arrow': leftArrow,
  'right-arrow': rightArrow,
};
