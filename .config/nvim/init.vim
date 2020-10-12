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

" plugins
call plug#begin()
Plug 'preservim/nerdtree' " nerdtree navigation
Plug 'rust-lang/rls' " rust rls server
Plug 'rust-lang/rust.vim' " formatting
Plug 'neoclide/coc.nvim', {'branch': 'release'} " coc (code completion)
Plug 'google/vim-maktaba' " multilang format
Plug 'google/vim-codefmt' " multilang format
Plug 'google/vim-glaive' " multilang format
Plug 'iamcco/markdown-preview.nvim', { 'do': { -> mkdp#util#install() }, 'for': ['markdown', 'vim-plug']} " markdown preview
Plug 'junegunn/goyo.vim' " distraction-free vim
Plug 'jiangmiao/auto-pairs' " auto close pairs and more
Plug 'sheerun/vim-polyglot' " all language packs
Plug 'Yggdroot/indentLine' " indentation lines
Plug 'junegunn/limelight.vim' " focused lighting
call plug#end()

" markdown auto preview, don't close automatically
let g:mkdp_auto_close = 0

" multilang format
call glaive#Install()

" nerdtree shortcut
map <C-n> :CocCommand explorer<CR>

" coc suggestions
" move between suggestions
inoremap <expr> <Tab> pumvisible() ? "\<C-n>" : "\<Tab>"
inoremap <expr> <S-Tab> pumvisible() ? "\<C-p>" : "\<S-Tab>"
" <CR> to accept
if exists('*complete_info')
  inoremap <expr> <cr> complete_info()["selected"] != "-1" ? "\<C-y>" : "\<C-g>u\<CR>"
else
  inoremap <expr> <cr> pumvisible() ? "\<C-y>" : "\<C-g>u\<CR>"
endif

" enable syntax highlighting and indent
syntax enable
filetype plugin indent on

" pmenu colors
hi Pmenu ctermbg=237 ctermfg=white
hi PmenuSel ctermbg=246 ctermfg=black

" autoformat on save
augroup autoformat_settings
  autocmd FileType bzl AutoFormatBuffer buildifier
  autocmd FileType c,cpp,proto,javascript,arduino AutoFormatBuffer clang-format
  autocmd FileType dart AutoFormatBuffer dartfmt
  autocmd FileType go AutoFormatBuffer gofmt
  autocmd FileType gn AutoFormatBuffer gn
  autocmd FileType html,css,sass,scss,less,json AutoFormatBuffer js-beautify
  autocmd FileType java AutoFormatBuffer google-java-format
  autocmd FileType python AutoFormatBuffer autopep8
  autocmd FileType rust AutoFormatBuffer rustfmt
  autocmd FileType vue AutoFormatBuffer prettier
augroup END

" exit terminal's insert mode for god's sake
:tnoremap <Esc> <C-\><C-n>

" git colors
hi DiffAdd ctermbg=49 ctermfg=black
hi DiffChange ctermbg=75 ctermfg=black
hi DiffDelete ctermbg=203 ctermfg=black

" fly mode for autopairs
let g:AutoPairsFlyMode = 0
let g:AutoPairsShortcutBackInsert = '<M-b>'

" selection color
hi Visual ctermbg=237

" move to end and beginning of line while in insert mode
inoremap <C-e> <Esc>$a
inoremap <C-a> <Esc>0i

" indentation characters
let g:indentLine_char = '¦'
let g:indentLine_leadingSpaceEnabled = 1
let g:indentLine_leadingSpaceChar = '.'

" limelight colors
let g:limelight_conceal_ctermfg = 'DarkGrey'
let g:limelight_default_coefficient = 0.1

" goyo settings
function! s:goyo_enter()
  set rnu nu
  Limelight
endfunction

function! s:goyo_leave()
  Limelight!
endfunction

autocmd! User GoyoEnter nested call <SID>goyo_enter()
autocmd! User GoyoLeave nested call <SID>goyo_leave()

" open coc-explorer on startup (no need to nvim . now)
autocmd User CocNvimInit :CocCommand explorer
