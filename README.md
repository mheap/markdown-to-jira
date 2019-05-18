# Markdown to Jira

This project is a command line tool to allow you to make markdown-like notes as
plain text and use them to create Jira tickets. It supports `title`, `description`,
`assignee` and `components` for both parent and sub-tasks. It does not currently
support epics.

## Installation

```bash
npm install -g markdown-to-jira
```

Create a file at `~/.atlassian/credentials` with the following contents:

```ini
[default]
host=your_company.atlassian.net
username=user@your-company.com
token=TOKEN # See https://id.atlassian.com/manage/api-tokens
project=ACME
```

## Usage

### Provide a string on the CLI
```
m2j -s 'This is an example ticket @michael.heap {Documentation} {Node}'
```

### Provide a file

```
m2j -f /path/to/file
```

Example content:

```
- This is an example ticket @michael.heap {Documentation} {Node}
```

## Ticket format

## Basic

* `@user.name` - assign a ticket and any child tickets to a user
* `{Name}` - add a component to a ticket. Supports multiple components
* Any other text on the line will be used as the ticket title

### Advanced

If you're using the `-f` option to pass a filename there are additional options available.

```
- This is an example ticket @michael.heap {Documentation} {Node}
  This is a description for the above title. It will be added 
  automatically and the description can span multiple lines
- This is another top level ticket without an assignee or components
- One more ticket, which will have children @michael.heap
  This is a description
  - And this is a sub-ticket
    Subtickets can have descriptions too, and they inherit the assignee
    and components from the parent ticket
```



