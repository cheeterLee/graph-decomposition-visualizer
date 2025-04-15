# Treewidth Decomposition Visualizer

### Powered by Cloudflare Workers on 
https://graph-decomp-visualizer.cheeterlee.workers.dev/ 


## Overview

The tool provides a web-based interface for running the <a href="https://en.wikipedia.org/wiki/Treewidth" target="_blank">treewidth</a> decomposition algorithm, helping users explore insights between the decomposed tree and the original graph through interactive visualizations.

## Core Stack
[![Stack](https://skillicons.dev/icons?i=remix,typescript,wasm,cpp,redux,d3&titles=true)]()  

<a href="https://remix.run/" target="_blank">Remix</a>, <a href="https://www.typescriptlang.org/" target="_blank">TypeScript</a>, <a href="https://webassembly.org/" target="_blank">WebAssembly</a>, <a href="https://isocpp.org/" target="_blank">Cpp</a>, <a href="https://redux-toolkit.js.org/" target="_blank">Redux</a>, <a href="https://d3js.org/" target="_blank">D3.js</a>

## Core Modules

- <a href="https://github.com/cheeterLee/graph-decomposition-visualizer/tree/main/app/modules/svg-editor" target="_blank">Svg Editor</a>: A graph editor built with <a href="https://developer.mozilla.org/en-US/docs/Web/SVG" target="_blank">SVG</a> and <a href="https://d3js.org/" target="_blank">D3.js</a> that lets users create a graph from scratch or load one from uploaded or sample files. It supports gestures such as drag-and-drop, zooming, panning, and vertex/edge highlighting.


- <a href="https://github.com/cheeterLee/graph-decomposition-visualizer/tree/main/app/modules/algorithm-runner" target="_blank">Algorithm Runner</a>: An algorithm runner that executes the treewidth decomposition algorithm, compiled in <a href="https://webassembly.org/" target="_blank">WebAssembly</a> format, in a <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API" target="_blank">Web Worker</a>. 

- <a href="https://github.com/cheeterLee/graph-decomposition-visualizer/tree/main/app/modules/canvas-display" target="_blank">Canvas Display</a>: A <a href="https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API" target="_blank">Canvas</a> and <a href="https://d3js.org/" target="_blank">D3.js</a> based widget that displays the result of treewidth decomposition as a force-simulated graph or raw text, with optional download support. It supports click and group highlighting, allowing users to compare highlighted portions between the original graph and its decomposed version.

## Feature Snapshots

<p align="center">
  <img width="1656" alt="image" src="https://github.com/user-attachments/assets/9b5b6d3a-5cdd-43a0-9d21-645cd16f4e82" />
  <em>Edge higlighting</em>
</p>

<p align="center">
  <img width="1656" alt="image" src="https://github.com/user-attachments/assets/7ad190be-63f6-4236-af87-5860e29591c0" />
  <em>Groups higlighting</em>
</p>


<p align="center">
© Ziyi Li, University of Leeds, 2025
</p>