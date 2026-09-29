import { readQuestionLink, questionUrl, questionTypes } from './questionLinks';
test.each(questionTypes)('reads and writes %s question links', type => {
 expect(readQuestionLink(`?${type}=12`)).toEqual({type,id:12});
 expect(questionUrl('https://example.com/?practice=1', {type,id:12})).toBe(`https://example.com/?${type}=12`);
});
test.each(['', '?practice=0', '?test=-1', '?prep=1.5', '?experiment=abc', '?test=1&test=2', '?practice=9007199254740992', '?practice=1&prep=2', '?stepbystep=1'])('ignores invalid or ambiguous link %s', search => {
 expect(readQuestionLink(search)).toBeNull();
});
test('preserves the deployment path and unrelated URL fields', () => {
 expect(questionUrl('https://example.com/memory/?other=2#section', {type:'prep',id:3})).toBe('https://example.com/memory/?other=2&prep=3#section');
});
test('removes question parameters when leaving a question', () => {
 expect(questionUrl('https://example.com/?test=2&other=1',null)).toBe('https://example.com/?other=1');
});
