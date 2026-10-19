import { questionTypes } from './utils/questionLinks';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionTab from './QuestionTab';
import { fetchQuestion, fetchQuestionCount, fetchQuestionTopics } from './utils/FetchQuestionService';
import { saveQuestionCanvasData } from '../../memoryModelEditor/utils/localStorage';
jest.mock('./utils/FetchQuestionService');
jest.mock('react-markdown', () => ({__esModule:true,default:({children}:any)=>children}));
const props = () => ({questionIndex:2, setQuestionIndex:jest.fn(), questionType:'practice' as const,
 setQuestionType:jest.fn(), questionView:'question' as const, setQuestionView:jest.fn(),
 onSubmit:jest.fn(), onSubmitAtLine:jest.fn(), setSubmissionResults:jest.fn(), onClearCanvas:jest.fn(),
 onRestoreCanvas:jest.fn(),currentCanvasState:{elements:[],ids:[],classes:[]},isSandboxMode:false});
beforeEach(() => {
 jest.clearAllMocks(); localStorage.clear(); window.history.replaceState(null,"","/");
 (fetchQuestion as jest.Mock).mockResolvedValue({id:2,question:'Draw this model',code:['a = 5'],answer:null,canvasConfig:null});
 (fetchQuestionCount as jest.Mock).mockResolvedValue(2);
 (fetchQuestionTopics as jest.Mock).mockResolvedValue([]);
});
afterEach(() => window.history.replaceState(null,'','/'));
test.each(questionTypes)('%s link loads its starting frame instead of a saved answer', async type => {
 saveQuestionCanvasData(type,2,{elements:[{boxId:5,id:5,x:0,y:0,kind:{name:'primitive',type:'int',value:'99'}}],ids:[5],classes:[]});
 const p=props(), consumed=jest.fn();
 render(<QuestionTab {...p} questionType={type} linkedQuestion={{type, id:2}} onQuestionLinkConsumed={consumed}/>);
 await screen.findByText('Draw this model');
 expect(fetchQuestion).toHaveBeenCalledWith(2,type);
 await waitFor(()=>expect(consumed).toHaveBeenCalledTimes(1));
 const [elements,ids]=p.onRestoreCanvas.mock.calls[0];
 expect(elements).toHaveLength(1);
 expect(elements[0].kind.functionName).toBe('__main__');
 expect(ids).toEqual([]);
});
test.each(questionTypes)('shows the current %s question in the address bar without a copy button', async type => {
 render(<QuestionTab {...props()} questionType={type}/>);
 await screen.findByText('Draw this model');
 await waitFor(() => expect(window.location.search).toBe(`?${type}=2`));
 expect(screen.queryByRole('button',{name:'Copy question link'})).not.toBeInTheDocument();
});
test('uses the category URL when returning to the list', async () => {
 render(<QuestionTab {...props()}/>);
 await screen.findByText('Draw this model');
 await waitFor(() => expect(window.location.search).toBe('?practice=2'));
 await act(async () => { userEvent.click(screen.getByRole('button',{name:'← Back'})); });
 await waitFor(() => expect(window.location.search).toBe('?practice'));
});
test('a missing linked question shows an explanation and returns to the list', async () => {
 (fetchQuestion as jest.Mock).mockRejectedValue(new Error('not found'));
 const spy=jest.spyOn(console,'error').mockImplementation(()=>{});
 const p=props(), consumed=jest.fn();
 render(<QuestionTab {...p} linkedQuestion={{type: "practice", id:2}} onQuestionLinkConsumed={consumed}/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
 expect(p.setQuestionIndex).toHaveBeenCalledWith(null);
 expect(consumed).toHaveBeenCalledTimes(1);
 spy.mockRestore();
});

test.each(questionTypes)('opens %s category without fetching an individual question', async type => {
 window.history.replaceState(null, '', `/?${type}`);
 render(<QuestionTab {...props()} questionType={type} questionIndex={null} questionView="list"/>);
 await screen.findByRole('button', {name:/Q1/});
 expect(fetchQuestion).not.toHaveBeenCalled();
 expect(window.location.search).toBe(`?${type}`);
 await act(async () => { userEvent.click(screen.getByRole('button',{name:'← Back'})); });
 await waitFor(() => expect(window.location.search).toBe(''));
});
test('malformed question ID shows an error without fetching a question', async () => {
 window.history.replaceState(null, '', '/?practice=abc');
 render(<QuestionTab {...props()} questionIndex={null} questionView="list"/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('link is invalid');
 expect(fetchQuestion).not.toHaveBeenCalled();
});
