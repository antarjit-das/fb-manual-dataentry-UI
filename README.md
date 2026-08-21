# Dattix

A local-first research utility for collecting, reviewing, structuring, and storing publicly accessible Facebook post and comment data for academic and non-profit research.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Research Workflow](#research-workflow)
- [Data Collection Boundaries](#data-collection-boundaries)
- [Privacy & Data Handling](#privacy--data-handling)
- [Academic Research & Ethics](#academic-research--ethics)
- [Platform & Terms-of-Service Boundaries](#platform--terms-of-service-boundaries)
- [Data Model](#data-model)
- [Parsing & Data Processing](#parsing--data-processing)
- [Engagement Metrics](#engagement-metrics)
- [Data Integrity & Provenance](#data-integrity--provenance)
- [Technical Limitations](#technical-limitations)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Canonical JSON](#canonical-json)
- [Repository & Dataset Safety](#repository--dataset-safety)
- [Development & Testing](#development--testing)
- [License & Third-Party Rights](#license--third-party-rights)
- [Citation](#citation)
- [Roadmap](#roadmap)

## About

### What is Dattix?

Dattix is a local-first web application that turns researcher-provided Facebook post and comment text into a structured Excel dataset.

It supports:

- post and engagement metadata;
- commenter names and comment/reply text;
- nested comment/reply relationships;
- researcher review and manual correction;
- structured JSON import;
- local Excel storage and backups.

The project is intended for qualitative, quantitative, linguistic, and computational social-media research.

### Purpose

The tool addresses a practical research problem: copied social-media text is often mixed with interface text and is difficult to organize consistently. Dattix parses that input, reconstructs comment/reply relationships, preserves original text, and stores the result in a structured workbook.

### Intended Users

- Academic and independent researchers
- Computational social scientists
- Linguists and NLP researchers
- Sociologists and media researchers
- Researchers studying multilingual or code-mixed online discourse

### What This Project Is Not

- It is not an automated Facebook crawler or bot.
- It does not log into Facebook or collect credentials.
- It does not provide CAPTCHA, anti-bot, or access-control bypasses.
- It does not access private or unauthorized content.
- It does not distribute the researcher's collected dataset.
- It is not affiliated with or endorsed by Meta or Facebook.

## Features

### Researcher-Directed Data Ingestion

Import data through:

- manual entry;
- copied browser/clipboard text;
- Canonical JSON.

### Raw Clipboard Parser

Parses copied Facebook comment text, removes common interface noise, identifies commenter names, detects language/script patterns, and reconstructs comment/reply relationships. Parser still in beta-build so I can hopefully push updates to further boost the efficiency and accuracy of it.

### Canonical JSON Import

Accepts structured JSON from compatible scripts or preprocessing workflows and validates it against the project's schema.

### Nested Comment & Reply Support

Supports arbitrary-depth reply trees and preserves parent-child relationships.

### Commenter Name Preservation

Preserves publicly displayed commenter names for authorship, provenance, and conversation analysis.

### Lossless Text Storage

Original comment and reply text is preserved during storage rather than normalized into cleaner or rewritten text.

### Engagement Metrics

Supports:

- views;
- shares;
- comments;
- total reactions;
- Like, Love, Haha, Wow, Sad, Angry, and Care reactions;
- comment/reply reaction counts.

### Metric Precision

Tracks whether a post-level metric was:

- exact;
- approximate;
- unavailable.

The raw displayed value is retained alongside the normalized value where applicable.

### Researcher Review

Parsed data remains editable before it is saved.

### Local Excel Dataset

Stores data in a multi-sheet `.xlsx` workbook containing:

- `POSTS`
- `COMMENTS`
- `REPLIES`
- `SOURCES`
- `CODEBOOK`

### Backups

The workbook is written through a temporary file, checked, backed up, and then replaced to reduce the risk of data loss or corruption.

## Research Workflow

```text
Public Facebook Content
        ↓
Researcher views content in a browser
        ↓
Researcher copies visible content
        ↓
Raw Text Parser or Canonical JSON
        ↓
Researcher reviews and corrects parsed data
        ↓
Local Excel Dataset
        ↓
Research analysis
```

### Browser / Clipboard Acquisition

Researchers may use standard browser functionality, including Chrome DevTools, to copy content that is already accessible to them through the Facebook website. The copied content is then supplied to the application through the clipboard or another researcher-controlled input.

Using DevTools is recommended for better efficiency since theres no way you can add posts with 1000+ comments THAT efficiently. The intended workflow to use this technique is as follows: Open DevTools → Console (F12 → Console) → Run "copy(window.getSelection().toString())". The selected text is now in your clipboard, so just Ctrl+V wherever you need it.

The project does not automate this browser interaction or independently retrieve Facebook content.

### Researcher Verification

Before saving, researchers should verify:

- commenter names;
- comment and reply text;
- reply hierarchy;
- engagement values;
- exact/approximate metric status;
- source and collection information.

## Data Collection Boundaries

### Intended Collection Workflow

This project is designed for researcher-directed collection of publicly accessible Facebook content. Researchers access the content through a standard web browser and provide it to the application through researcher-controlled input such as copied clipboard text or structured JSON.

The application does not independently crawl or retrieve Facebook data and is not intended for accessing private, restricted, or unauthorized content.

As per beta-testing, I couldnt find a way to commit reaction counts of the comments and the replies into the raw text, like the comment text. So for the time being, manually adding the reaction counts is one of the only tedious jobs a data analyst or researcher needs to do.

Public accessibility does not by itself determine whether subsequent use or publication is permissible; researchers remain responsible for applicable laws, platform terms, and research requirements.

### What the Application Is Designed to Collect

The dataset may contain:

- post metadata;
- post text;
- source/page information;
- engagement metrics;
- publicly displayed commenter names;
- comments and replies;
- comment/reply reaction counts;
- collection timestamps and source information.

### What It Does Not Intentionally Access

The application is not designed to collect:

- passwords or Facebook credentials;
- access tokens or session cookies;
- private messages;
- private/restricted profiles or groups;
- phone numbers or email addresses;
- physical addresses or locations;
- unrelated profile information;
- hidden device identifiers.

### No Circumvention

The project does not provide mechanisms to:

- bypass authentication or access controls;
- defeat CAPTCHAs;
- bypass anti-bot protections;
- evade platform restrictions through proxy/account rotation;
- automate mass Facebook crawling;
- exploit undocumented platform interfaces.

### External Scripts and JSON

The application can import JSON produced by external scripts or other preprocessing tools. This import capability does not authorize the method used to obtain the underlying data.

Researchers are responsible for ensuring that any external acquisition or preprocessing method they use is appropriate under applicable law, research requirements, and platform terms.

## Privacy & Data Handling

### Publicly Visible Content

The intended dataset consists of content the researcher is already able to access through the relevant public-facing Facebook interface.

Public availability does not automatically mean that the content can be freely reproduced, redistributed, or published without further consideration.

### Data Minimization

Researchers should collect only the information reasonably necessary for their research question and avoid collecting unrelated personal information.

### Commenter Names

The application intentionally supports storing the publicly displayed name of a commenter or replier because it can be relevant to authorship, conversation structure, and research analysis.

Pseudonymization or anonymization is not required for the application's normal local data-entry workflow. Researchers may choose to apply it before sharing or publishing data when identification is not necessary.

### User-Generated Content

Comments and replies are user-generated content. Researchers should consider applicable intellectual-property, privacy, platform, and publication requirements before reproducing or redistributing verbatim content.

### Information Not Intentionally Collected

The application is not designed to collect unrelated personal information. If a researcher encounters sensitive or unnecessary personal information in copied content, it should be removed during review when it is not required for the research purpose.

### Local Storage

The application is designed for local-first operation. The collected dataset is stored in the researcher's local Excel workbook rather than being uploaded to a project-controlled cloud database.

Researchers remain responsible for securing their local dataset and backups.

### Retention & Sharing

Researchers should retain data only as long as necessary for their research and applicable institutional requirements.

Before sharing a dataset publicly or with third parties, researchers should consider whether names, verbatim comments, or other fields could identify individuals and whether minimization or pseudonymization is appropriate.

## Academic Research & Ethics

This tool is intended for academic, non-profit, linguistic, and analytical research.

Researchers should:

- Define the research purpose before collecting data.
- Collect only information necessary for that purpose.
- Document the source, collection period, sampling method, and relevant platform visibility settings.
- Determine whether institutional or research-ethics review is required.
- Protect locally stored datasets and backups.
- Take additional care when research concerns minors, vulnerable people, sensitive topics, or information that could expose individuals to harm.
- Consider pseudonymization, paraphrasing, or other safeguards before publication where identification is unnecessary.

The software provides technical tooling; it does not itself provide legal or ethical authorization to collect, process, publish, or redistribute a particular dataset.

Publicly accessible data should not automatically be treated as unrestricted for every downstream use.

## Platform & Terms-of-Service Boundaries

### Relationship to Facebook / Meta

This is an independent open-source project. It is not affiliated with, sponsored by, endorsed by, or supported by Meta Platforms, Inc. or Facebook.

Facebook and Meta are trademarks of Meta Platforms, Inc.

### Researcher-Directed Acquisition

Data acquisition is initiated and supervised by the researcher. The application operates on data supplied by the researcher rather than independently crawling Facebook.

### Platform Terms

Platform terms and policies may apply to a researcher's particular activity even when content is publicly accessible.

This README does not claim that every possible use of the software complies with Facebook/Meta's terms. Researchers are responsible for reviewing the terms and requirements applicable to their own workflow.

### No Circumvention

The project does not authorize or provide functionality for bypassing authentication, access controls, CAPTCHAs, anti-bot protections, or other technical restrictions.

## Data Model

The workbook is organized into five main sheets:

```text
SOURCES
   │
   └── POSTS
        │
        ├── COMMENTS
        │      └── REPLIES
        │            └── REPLIES ...
        │
        └── engagement metrics
```

### POSTS

Contains post-level information such as:

- `post_id`
- `platform`
- `content_type`
- `post_url`
- `source_name`
- `source_type`
- `original_post_date`
- `collection_date`
- `collection_timestamp`
- `language`
- `post_text`
- engagement metrics
- metric precision fields

### COMMENTS

Contains:

- `comment_id`
- `post_id`
- `commenter_name`
- `comment_text`
- reaction counts
- `reply_count`
- `collection_timestamp`

### REPLIES

Contains:

- `reply_id`
- `post_id`
- `parent_id`
- `commenter_name`
- `reply_text`
- reaction counts
- `collection_timestamp`

`parent_id` identifies either the parent comment or parent reply.

### SOURCES

Stores publishing/source information such as:

- `source_id`
- `source_name`
- `source_type`

### CODEBOOK

Contains the dataset's column definitions, data types, requirements, and controlled values.

## Parsing & Data Processing

The parser generally performs the following steps:

- Normalizes line endings and relevant Unicode whitespace.
- Removes common Facebook interface text.
- Identifies commenter headers.
- Separates comments and replies.
- Reconstructs reply relationships.
- Detects language/script patterns.
- Produces validated structured data.

### UI Noise Filtering

The parser can remove common interface elements such as:

- `Most relevant is selected`
- `Top comments`
- `All comments`
- `View more comments`
- `Write a comment…`
- `Reply`
- `Like`
- `Share`
- similar multilingual interface elements

### Text Preservation

The parser does not intentionally rewrite or normalize the actual comment text before persistence.

### Parsing Limitations

Because Facebook's interface can change and comment formatting can be ambiguous, some records may require manual correction.

## Engagement Metrics

The application records post-level and comment/reply engagement data where available.

### Precision

Post-level metrics can be marked as:

- `precise` — exact value displayed;
- `approximate` — shorthand such as `1.1K`;
- `unavailable` — not available in the supplied content.

Both the normalized value and original display value can be retained.

### Count Discrepancies

Platform-displayed totals may differ from the number of comments actually visible or captured. Researchers should distinguish between:

- the platform's displayed aggregate;
- the number of records actually captured by the researcher.

## Data Integrity & Provenance

The application records provenance information such as:

- source URL;
- source name/type;
- collection date;
- collection timestamp.

Researchers should additionally document their sampling method and whether the interface was showing all comments or a filtered/ranked view.

The researcher reviews parsed data before it is saved.

If external scripts or LLMs are used to prepare Canonical JSON, researchers should retain enough information about that preprocessing to explain how the final dataset was produced.

## Technical Limitations

- Facebook interface changes may require parser updates.
- Ambiguous comment/reply formatting may require manual correction.
- Visible comments may be affected by Facebook's ranking and filtering.
- Deleted or moderated content cannot be recovered.
- Platform aggregate counts may differ from visible/captured records.
- Language detection is heuristic and is not guaranteed to be correct.
- Excel is not intended for extremely large-scale database workloads.
- The local workbook is designed for sequential/single-researcher use.
- LLM-generated JSON may contain errors and should always be reviewed.

## Installation

### Prerequisites

- Node.js 20.x or later
- npm, pnpm, or yarn
- Git

### Clone

```bash
git clone https://github.com/antarjit-das/dattix.git
cd dattix
```

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
npm test
```

### Start the Application

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Configuration

The application works with its default configuration.

Optional settings can be placed in `.env.local`:

```env
WORKBOOK_PATH=./data/facebook_dataset.xlsx   #(default; you can change it as per preferences)
BACKUP_DIR=./data/backups
PORT=3000
```

- `WORKBOOK_PATH` — location of the Excel dataset.
- `BACKUP_DIR` — location of workbook backups.
- `PORT` — local development server port.

Look at this template for your own .env.local in the repo's .env.example file. 

Do not commit `.env.local` if it contains sensitive local information.

## Usage

### Create a Dataset Entry

- Open the application.
- Select Collect New Post.
- Enter the post metadata.
- Add comments manually or use the Autofill Pipeline.

### Import Clipboard Text

- Open the relevant Facebook content in your browser.
- Expand the desired comment/reply threads.
- Copy the visible content.
- Paste it into Raw Facebook Text.
- Run the parser.
- Review and correct the generated records.
- Save the post.

### Import Canonical JSON

- Open Supply / Paste Canonical JSON.
- Paste valid JSON or upload a `.json` file.
- Apply it to the form.
- Review the generated records.
- Save the post.

### Edit Existing Records

Existing posts can be reopened from the dashboard, edited, and saved again.

### Backups

Previous workbook versions are stored in the configured backup directory before dataset updates.

## Canonical JSON

Canonical JSON is the structured input format used by the application.

A comment contains:

```json
{
  "commenter_name": "Example User",
  "comment_text": "Example comment",
  "like_count": 5,
  "love_count": 0,
  "haha_count": 0,
  "wow_count": 0,
  "sad_count": 0,
  "angry_count": 0,
  "care_count": 0,
  "replies": []
}
```

Replies use the same structure and can contain further nested replies.

The schema is validated before the data is applied to the form.

## Repository & Dataset Safety

### Included in the Repository

- Application source code
- Parser and validation logic
- Tests
- Workbook templates
- Codebook definitions
- Documentation

### Not Included

The public repository should not contain:

- real research datasets;
- collected Facebook-derived personal data;
- active study workbooks;
- credentials;
- session cookies;
- API keys or other secrets.

### Local Research Dataset

The researcher's actual dataset is intended to remain local and private.

A typical `.gitignore` should include:

```gitignore
data/facebook_dataset.xlsx
data/backups/
data/*.xlsx
*.tmp
.env.local
```

### Example Data

Examples and tests should use synthetic or appropriately anonymized data rather than the researcher's real dataset.

## Development & Testing

### Useful Commands

```bash
npm run dev
npm run build
npm test
npm run lint
```

### Tests

The test suite covers parsing, nested comment/reply structures, metric handling, and Excel persistence.

When modifying the parser or data model, run the full test suite before committing changes.

## License & Third-Party Rights

### MIT License

This project is released under the MIT License. See `LICENSE` for the complete license.

Copyright (c) 2026 Antarjit Das.

### Third-Party Dependencies

The project uses open-source dependencies including Next.js, React, React Hook Form, Zod, ExcelJS, and Tailwind CSS. Each dependency remains subject to its own license.

### Third-Party Content

The project's MIT license applies to the project's own software, not to third-party content collected or processed using the software.

Users remain responsible for applicable intellectual-property, privacy, platform, and other rights relating to third-party content.

## Citation

If you use this tool in your academic research:

```bibtex
@misc{das2026dattix,
  author = {Das, Antarjit},
  title = {Dattix: A Local-First Research Utility for Hierarchical Social Media Discourse Analysis},
  year = {2026},
  publisher = {https://github.com/antarjit-das},
  howpublished = {\url{https://github.com/antarjit-das/dattix-fb-data-research-utility}}
}
```

When publishing a dataset created with this tool, document the software version, collection period, sampling method, and relevant data-handling decisions.

## Roadmap

- CSV and Parquet export
- Batch JSON import
- Research network visualization
- R/Python export helpers
- Expanded Indic language support
- Research annotation tools
- Multi-coder research workflows
