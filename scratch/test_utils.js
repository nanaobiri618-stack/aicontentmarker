const { parseAiJSON } = require('../src/lib/ai/utils');

function testParsing() {
  const cases = [
    {
      input: '```json\n{"test": "ok"}\n```',
      expected: { test: "ok" }
    },
    {
      input: 'Here is the data: {"hello": "world"} hope this helps',
      expected: { hello: "world" }
    },
    {
      input: '[{"id": 1}]',
      expected: [{ id: 1 }]
    }
  ];

  cases.forEach((c, i) => {
    try {
      const result = parseAiJSON(c.input);
      console.log(`Test ${i+1}:`, JSON.stringify(result) === JSON.stringify(c.expected) ? 'PASSED' : 'FAILED');
    } catch (e) {
      console.log(`Test ${i+1}: ERROR`, e.message);
    }
  });
}

testParsing();
console.log('--- Agent Utility Test Complete ---');
