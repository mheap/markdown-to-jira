module.exports = function(input) {
  // Extract ticket titles
  const lines = input.split("\n");
  const tickets = [];

  const leadingWhitespace = /^\s+/;

  let frontMatter;
  let ticket;
  let subTicket;
  let blankLinesInDescriptions = "";

  for (line of lines) {
    // Ignore blank lines unless we could be in a description
    if (!line.trim() && !ticket) {
      continue;
    }

    // Is this a top level entry? If it has no leading whitespace
    // we assume that it is
    if (!leadingWhitespace.test(line)) {
      // If it's a blank line add it to the current ticket description
      if (!line[0]) {
        blankLinesInDescriptions += "\n";
        continue;
      }

      // If it's not just a blank line
      // If we have an active subticket, push it in to the list
      if (subTicket) {
        ticket.children.push(subTicket);
        subTicket = null;
      }

      // If we have an active ticket, push it in to the list
      if (ticket) {
        tickets.push(ticket);
        ticket = null;
      }

      // If the line has a length, but it's not a new ticket entry
      if (line[0] && line[0] != "-" && !ticket) {
        throw new Error(
          "Missing ticket title. Did you miss a dash before your entry?"
        );
      }

      // Process the top level ticket
      line = removeLeadingDash(line);

      [assignee, line] = extractAssignee(line);
      [components, line] = extractComponents(line);

      if (line) {
        ticket = {
          title: line,
          description: "",
          children: [],
          assignee: assignee,
          components: components
        };
      }

      continue;
    }

    // If it has leading whitespace we should have an active ticket
    if (!ticket) {
      throw new Error("Unexpected indentation discovered");
    }

    // If it has leading whitespace but no dash it could be a ticket description
    // It is one if we don't have an active SubTicket
    if (ticket && !subTicket && !/^\s+\-/.test(line)) {
      // Otherwise it's a ticket description
      ticket.description += blankLinesInDescriptions + line.trim() + "\n";
      blankLinesInDescriptions = "";
      continue;
    }

    // Otherwise it's a subticket or a description as it has leading whitespace
    // so let's strip it off
    line = line.trim();

    // If the line starts with a - then it's a subticket title
    if (line[0] == "-") {
      // If it's a new subticket, push in the old one
      if (subTicket) {
        ticket.children.push(subTicket);
      }

      line = removeLeadingDash(line);
      [assignee, line] = extractAssignee(line);
      [components, line] = extractComponents(line);

      // Persist the parent assignee if we don't have one in this line
      assignee = assignee || ticket.assignee;
      components = components.length ? components : ticket.components;

      subTicket = {
        components: components,
        assignee: assignee,
        title: line,
        description: ""
      };
      continue;
    }

    // Otherwise it could be a description
    line = line.trim();
    if (line) {
      subTicket.description += blankLinesInDescriptions + line + "\n";
      blankLinesInDescriptions = "";
    }
  }

  // Push in the last item
  if (subTicket) {
    ticket.children.push(subTicket);
  }
  if (ticket) {
    tickets.push(ticket);
  }

  return tickets;
};

function removeLeadingDash(line) {
  return line.replace("- ", "");
}

function extractAssignee(line) {
  // Extract assignee if one exists
  let re = /@([^\s]+)/g;
  let matches = line.match(re);

  let assignee = "";
  if (matches) {
    if (matches.length > 1) {
      throw new Error(
        "Multiple assignees for a single ticket are not supported"
      );
    }

    assignee = matches[0].substr(1);

    // Remove match from line
    line = line.replace(matches[0], "").trim();
  }

  return [assignee, line];
}

function extractComponents(line) {
  let re = /{([^}]+)}/g;
  let matches = line.match(re);

  let components = [];

  if (matches) {
    components = matches.map(m => m.replace(/[{}]/g, ""));
    line = line.replace(new RegExp(matches.join("|"), "g"), "").trim();
  }

  return [components, line];
}
