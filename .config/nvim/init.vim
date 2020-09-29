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

" nerdtree
call plug#begin()
Plug 'preservim/nerdtree'
call plug#end()
map <C-n> :NERDTreeToggle<CR>
