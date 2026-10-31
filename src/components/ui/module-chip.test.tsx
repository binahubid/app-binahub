import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it} from 'vitest';
import {PROGRAM_MODULE_KEYS,PROGRAM_MODULE_META,type ProgramModuleKey} from '@/lib/program-modules';
import {ModuleChip} from './module-chip';
afterEach(cleanup);
describe('ModuleChip uses the selected module, never a T-BOS fallback',()=>{
 for(const key of PROGRAM_MODULE_KEYS) it(key,()=>{
  render(<ModuleChip moduleKey={key} description/>);
  expect(screen.getByText(PROGRAM_MODULE_META[key].label+' · '+PROGRAM_MODULE_META[key].description)).toBeVisible();
  if(key!=='tbos') expect(screen.queryByText(/T-BOS/)).not.toBeInTheDocument();
 });
 it('does not mislabel an unknown runtime module',()=>{const {container}=render(<ModuleChip moduleKey={'unknown' as ProgramModuleKey}/>);expect(container).toBeEmptyDOMElement();});
});
