" convert tab to 2 spaces
set tabstop=2
set shiftwidth=2
set expandtab

" line numbers
set relativenumber number

" pair matching colors
hi MatchParen cterm=bold ctermbg=none ctermfg=160

" case insensitive search unless caps in search
set ignorecase
set smartcase

" enable mouse support
set mouse+=a

" force out of bad habit of using arrow keys
" normal mode
nnoremap <Left>  :echoe "Use h"<CR>
nnoremap <Right> :echoe "Use l"<CR>
nnoremap <Up>    :echoe "Use k"<CR>
nnoremap <Down>  :echoe "Use j"<CR>
" insert mode
inoremap <Left>  <ESC>:echoe "Use h"<CR>
inoremap <Right> <ESC>:echoe "Use l"<CR>
inoremap <Up>    <ESC>:echoe "Use k"<CR>
inoremap <Down>  <ESC>:echoe "Use j"<CR>

" auto insert closing braces
inoremap { {}<Esc>i
inoremap {<CR> {<CR>}<Esc>O
inoremap ( ()<Esc>i
inoremap (<CR> (<CR>)<Esc>O
inoremap [ []<Esc>i
inoremap [<CR> [<CR>]<Esc>O

" plugins
call plug#begin()
Plug 'preservim/nerdtree' " nerdtree navigation
Plug 'rust-lang/rls' " rust rls server
Plug 'rust-lang/rust.vim' " formatting
Plug 'neoclide/coc.nvim', {'branch': 'release'} " coc (code completion)
call plug#end()

" nerdtree shortcut
map <C-n> :NERDTreeToggle<CR>

" coc suggestions
" move between suggestions
inoremap <expr> <Tab> pumvisible() ? "\<C-n>" : "\<Tab>"
inoremap <expr> <S-Tab> pumvisible() ? "\<C-p>" : "\<S-Tab>"

" overwrite closing bracket
inoremap <expr> ) getline('.')[getpos('.')[2] - 1] == ')' ? '<Right>' : ')'
inoremap <expr> } getline('.')[getpos('.')[2] - 1] == '}' ? '<Right>' : '}'
inoremap <expr> ] getline('.')[getpos('.')[2] - 1] == ']' ? '<Right>' : ']'
inoremap <expr> " getline('.')[getpos('.')[2] - 1] == '"' ? '<Right>' : '""<Esc>i'
inoremap <expr> ' getline('.')[getpos('.')[2] - 1] == "'" ? '<Right>' : "''<Esc>i"

" enable syntax highlighting and indent
syntax enable
filetype plugin indent on

" autoformat on save
let g:rustfmt_autosave = 1

" pmenu colors
hi Pmenu ctermbg=237 ctermfg=white
hi PmenuSel ctermbg=246 ctermfg=black
