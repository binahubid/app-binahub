import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import type {ComponentProps} from 'react';
import {AdminShell} from './admin-shell';
const mocks = vi.hoisted(()=>({signOut:vi.fn(),replace:vi.fn(),prefetch:vi.fn(),refresh:vi.fn()}));
vi.mock('next/navigation',()=>({usePathname:()=>'/admin/programs',useRouter:()=>mocks}));
vi.mock('next/link',()=>({default:({children,href}:ComponentProps<'a'>)=><a href={href}>{children}</a>}));
vi.mock('next/image',()=>({default:()=> <span>BinaHub</span>}));
vi.mock('@/lib/supabase',()=>({supabase:{auth:{getSession:async()=>({data:{session:null}}),signOut:mocks.signOut}}}));
vi.mock('@/components/help-sidebar',()=>({HelpSidebar:()=> <p>Panduan program</p>}));
function setup(){return render(<AdminShell eyebrow="Program & Produk" title="Program"><p>Daftar program contoh</p></AdminShell>);}
describe('admin shell polish preserves navigation',()=>{
 it('keeps a focusable skip destination and named menu search',()=>{setup();expect(screen.getByRole('main')).toHaveAttribute('id','admin-page-content');expect(screen.getByRole('main')).toHaveAttribute('tabindex','-1');expect(screen.getByRole('searchbox',{name:'Cari menu admin'})).toBeInTheDocument();expect(mocks.signOut).not.toHaveBeenCalled();});
 it('filters the same menu without changing routes',()=>{setup();fireEvent.change(screen.getByRole('searchbox',{name:'Cari menu admin'}),{target:{value:'PETA'}});const nav=screen.getByRole('navigation',{name:'Navigasi utama admin'});expect(within(nav).getByRole('link',{name:/PETA/})).toHaveAttribute('href','/admin/peta');expect(within(nav).queryByRole('link',{name:'Katalog Produk'})).not.toBeInTheDocument();});
 it('closes the mobile drawer with Escape and restores focus',async()=>{setup();const trigger=screen.getByRole('button',{name:'Buka navigasi admin'});fireEvent.click(trigger);expect(screen.getByRole('dialog',{name:'Navigasi admin'})).toBeInTheDocument();fireEvent.keyDown(document,{key:'Escape'});await waitFor(()=>expect(screen.queryByRole('dialog',{name:'Navigasi admin'})).not.toBeInTheDocument());expect(trigger).toHaveFocus();});
 it('keeps the contextual guide keyboard-accessible',async()=>{setup();fireEvent.click(screen.getByRole('button',{name:'Buka cara kerja halaman'}));expect(screen.getByRole('dialog',{name:/Cara kerja Program/})).toBeInTheDocument();fireEvent.keyDown(document,{key:'Escape'});await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());});
});
