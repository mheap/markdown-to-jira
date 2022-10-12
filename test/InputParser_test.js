var expect = require('chai').expect;
const InputParser = require('../src/InputParser');

describe('InputParser', function() {
    it('should be a function', function() {
        expect(InputParser).to.be.an.instanceof(Function);
    });

    it('should error on top level items without an active ticket', function() {
        const input = 'Hello';
        expect(() => { InputParser(input); }).to.throw("Missing ticket title. Did you miss a dash before your entry?");
    });

    it('should extract top level tickets', function() {
        const input = `
- This is a top level ticket
- This is another top level ticket
        `;

        const actual = InputParser(input);
        expect(actual[0]).to.include({'title': 'This is a top level ticket'});
        expect(actual[1]).to.include({'title': 'This is another top level ticket'});

    });

    it('should extract top level tickets with whitespace', function() {
        const input = `
- This is a top level ticket

- This is another top level ticket
        `;

        const actual = InputParser(input);
        expect(actual[0]).to.include({'title': 'This is a top level ticket'});
        expect(actual[1]).to.include({'title': 'This is another top level ticket'});

    });

    it('should process multiple child tickets', function() {
const input = `
- This is a top level ticket
  - And this is a sub ticket
  - Plus another one
`;

        const actual = InputParser(input);
        expect(actual[0]).to.eql({
            'assignee': '',
            'components': [],
            'labels': [],
            'title': 'This is a top level ticket',
            'description': '',
            'children': [
                {'title': 'And this is a sub ticket', 'description': '', 'assignee': '', 'components': [], 'labels': []},
                {'title': 'Plus another one', 'description': '', 'assignee': '', 'components': [], 'labels': []}
            ]
        });

    });

    it('should ignore empty child descriptions', function() {
const input = `
- This is a top level ticket
  - And this is a sub ticket
    `;

        const actual = InputParser(input);
        expect(actual[0]).to.eql({
            'assignee': '',
            'components': [],
            'labels': [],
            'title': 'This is a top level ticket',
            'description': '',
            'children': [
                {'title': 'And this is a sub ticket', 'description': '', 'assignee': '', 'components': [], 'labels': []}
            ]
        });

    });

    it('should process multi-line ticket descriptions', function() {
        const input = `
- This is a top level ticket
  Along with some description that
  spans multiple lines

  Including blank lines
`;
    
        const actual = InputParser(input);
        expect(actual[0]).to.eql({
            'assignee': '',
            'components': [],
            'labels': [],
            'title': 'This is a top level ticket',
            'description': "Along with some description that\nspans multiple lines\n\nIncluding blank lines\n",
            'children': []
        });
    });

    it('should process ticket descriptions', function() {
        const input = `
- This is a top level ticket
  Along with some description
`;
    
        const actual = InputParser(input);
        expect(actual[0]).to.eql({
            'assignee': '',
            'components': [],
            'labels': [],
            'title': 'This is a top level ticket',
            'description': "Along with some description\n",
            'children': []
        });
    });


    it('should process child ticket descriptions', function() {
        const input = `
- This is a top level ticket
  - And a subticket
    With a subticket description that is
    spread across multiple lines
`;

        const actual = InputParser(input);
        expect(actual[0]).to.eql({
            'assignee': '',
            'components': [],
            'labels': [],
            'title': 'This is a top level ticket',
            'description': '',
            'children': [{
                'assignee': '',
                'components': [],
                'labels': [],
                'title': 'And a subticket',
                'description': "With a subticket description that is\nspread across multiple lines\n"
            }]
        });


    });

    it('should capture assignment details in ticket titles', function() {
        let input = `
- this is a ticket @michael.heap
`;
        const actual = InputParser(input);
        expect(actual[0]).to.eql({
            'title': 'this is a ticket',
            'assignee': 'michael.heap',
            'components': [],
            'labels': [],
            'description': '',
            'children': []
        });
    });

    it('errors if there are multiple assignees on a single line', function() {
        let input = `
- This is a ticket @michael.heap @another.user
`;
        expect(() => { InputParser(input); }).to.throw("Multiple assignees for a single ticket are not supported")
    });

    it('should persist assignment for subtickets automatically', function() {
        let input = `
- This is a ticket @michael.heap
  - And this is a subticket
`;

        const actual = InputParser(input);
        expect(actual[0]).to.eql({
            'title': 'This is a ticket',
            'assignee': 'michael.heap',
            'components': [],
            'labels': [],
            'description': '',
            'children': [{
                'title': 'And this is a subticket',
                'assignee': 'michael.heap',
                'components': [],
                'labels': [],
                'description': '',
            }]
        });

    });

    it('should allow assignee overrides for subtickets', function() {
let input = `
- This is a ticket @michael.heap
  - And this is a subticket @another.user
`;

        const actual = InputParser(input);
        expect(actual[0]).to.eql({
            'title': 'This is a ticket',
            'assignee': 'michael.heap',
            'components': [],
            'labels': [],
            'description': '',
            'children': [{
                'title': 'And this is a subticket',
                'assignee': 'another.user',
                'components': [],
                'labels': [],
                'description': '',
            }]
        });

    });

    it('should capture components in parent tickets and use them in child tickets', function() {
let input = `
- This is a ticket {Nexmo Developer} {Another}
  - Child ticket with inherited components
`;

        const actual = InputParser(input);
        expect(actual[0]).to.eql({
            'title': 'This is a ticket',
            'assignee': '',
            'components': ['Nexmo Developer', 'Another'],
            'labels': [],
            'description': '',
            'children': [{
                'title': 'Child ticket with inherited components',
                'assignee': '',
                'description': '',
                'components': ['Nexmo Developer', 'Another'],
                'labels': [],
            }]
        });

    });

    it('should capture labels in parent tickets and use them in child tickets', function() {
let input = `
- This is a ticket #label1 #label2
  - Child ticket with inherited components
`;

        const actual = InputParser(input);
        expect(actual[0]).to.eql({
            'title': 'This is a ticket',
            'assignee': '',
            'components': [],
            'labels': ["label1", "label2"],
            'description': '',
            'children': [{
                'title': 'Child ticket with inherited components',
                'assignee': '',
                'description': '',
                'components': [],
                'labels': ["label1", "label2"],
            }]
        });
    });

    it('should should allow the override of labels in child tickets', function() {
let input = `
- This is a ticket #label1 #label2
  - Child ticket with inherited components #label3
`;

        const actual = InputParser(input);
        expect(actual[0]).to.eql({
            'title': 'This is a ticket',
            'assignee': '',
            'components': [],
            'labels': ["label1", "label2"],
            'description': '',
            'children': [{
                'title': 'Child ticket with inherited components',
                'assignee': '',
                'description': '',
                'components': [],
                'labels': ["label3"],
            }]
        });
    });


    it('should should allow the override of components in child tickets', function() {
let input = `
- This is a ticket {Nexmo Developer} {Another}
  - Child ticket with inherited components {Foo}
`;

        const actual = InputParser(input);
        expect(actual[0]).to.eql({
            'title': 'This is a ticket',
            'assignee': '',
            'components': ['Nexmo Developer', 'Another'],
            'labels': [],
            'description': '',
            'children': [{
                'title': 'Child ticket with inherited components',
                'assignee': '',
                'description': '',
                'components': ['Foo'],
                'labels': [],
            }]
        });

    });


    it('should throw an error when a ticket description is encountered unexpectedly (usually bad intentation)', function() {
let input = `
  - This is an indented ticket that should error
`;

        expect(() => { InputParser(input) }).to.throw("Unexpected indentation discovered");
    });
});
