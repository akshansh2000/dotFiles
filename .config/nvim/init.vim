"=============================================================================
" init.vim --- Entry file for neovim
" Copyright (c) 2016-2020 Wang Shidong & Contributors
" Author: Wang Shidong < wsdjeg@outlook.com >
" URL: https://spacevim.org
" License: GPLv3
"=============================================================================

execute 'source' fnamemodify(expand('<sfile>'), ':h').'/config/main.vim'

" convert tab to 2 spaces
set tabstop=2
set shiftwidth=2
set expandtab

" case insensitive search unless caps in search
set ignorecase
set smartcase

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

let g:neomake_rust_enabled_makers = ['rustc']

" multilang format
call glaive#Install()

" enable syntax highlighting and indent
syntax enable
filetype plugin indent on

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

" move to end and beginning of line while in insert mode
inoremap <C-e> <Esc>A
inoremap <C-a> <Esc>I

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

" selection color
hi Visual ctermbg=232

" devicons
let g:webdevicons_enable_vimfiler = 1
