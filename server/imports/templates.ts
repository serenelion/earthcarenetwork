export function generateEnterpriseTemplate(): string {
  const headers = [
    'name',
    'description',
    'category',
    'location',
    'website',
    'contactEmail',
    'tags'
  ];

  const examples = [
    [
      'Green Valley Farm',
      'Organic regenerative farm practicing permaculture and soil restoration',
      'land_projects',
      'Vermont, USA',
      'https://greenvalleyfarm.org',
      'contact@greenvalleyfarm.org',
      'agriculture,regenerative,organic'
    ],
    [
      'Earth Impact Fund',
      'Investment fund focused on regenerative agriculture and climate solutions',
      'capital_sources',
      'California, USA',
      'https://earthimpactfund.com',
      'info@earthimpactfund.com',
      'investment,climate,agriculture'
    ],
    [
      'Regenerative Network Platform',
      'Open-source platform for coordinating regenerative projects',
      'open_source_tools',
      'Global',
      'https://regennetwork.tools',
      'hello@regennetwork.tools',
      'software,coordination,open-source'
    ]
  ];

  const rows = [headers, ...examples];
  return rows.map(row => row.join(',')).join('\n');
}

export function generatePersonTemplate(): string {
  const headers = [
    'name',
    'email',
    'title',
    'phone',
    'linkedin',
    'status',
    'enterpriseId'
  ];

  const examples = [
    [
      'Jane Smith',
      'jane.smith@greenvalley.org',
      'Farm Director',
      '+1-555-0123',
      'https://linkedin.com/in/janesmith',
      'active',
      ''
    ],
    [
      'John Doe',
      'john@earthimpact.com',
      'Investment Manager',
      '+1-555-0456',
      'https://linkedin.com/in/johndoe',
      'prospect',
      ''
    ],
    [
      'Sarah Johnson',
      'sarah@regennetwork.tools',
      'Platform Coordinator',
      '+1-555-0789',
      'https://linkedin.com/in/sarahjohnson',
      'active',
      ''
    ]
  ];

  const rows = [headers, ...examples];
  return rows.map(row => row.join(',')).join('\n');
}

export function generateOpportunityTemplate(): string {
  const headers = [
    'title',
    'description',
    'value',
    'status',
    'probability',
    'expectedCloseDate',
    'notes',
    'enterpriseId',
    'primaryContactId'
  ];

  const examples = [
    [
      'Regenerative Farming Partnership',
      'Collaboration opportunity for carbon sequestration project',
      '50000',
      'qualified',
      '75',
      '2025-06-30',
      'Initial discussions very positive',
      '',
      ''
    ],
    [
      'Investment Round - Climate Solutions',
      'Series A funding for regenerative agriculture startup',
      '2000000',
      'proposal',
      '60',
      '2025-08-15',
      'Proposal submitted, awaiting committee review',
      '',
      ''
    ],
    [
      'Platform Integration Project',
      'Integrate regenerative network tools with existing CRM',
      '25000',
      'negotiation',
      '80',
      '2025-05-20',
      'Technical requirements finalized',
      '',
      ''
    ]
  ];

  const rows = [headers, ...examples];
  return rows.map(row => row.join(',')).join('\n');
}
