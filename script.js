/* VARIÁVEIS DO SISTEMA */
let score = 0;
let timer = 0;
let timerInterval = null;

const scoreDisplay = document.getElementById("score-display");
const timerDisplay = document.getElementById("timer-display");
const winScore = document.getElementById("win-score");
const winTime = document.getElementById("win-time");

function startTimer() {
    clearInterval(timerInterval);
    timer = 0;
    timerInterval = setInterval(() => {
        timer++;
        timerDisplay.textContent = "Tempo: " + formatTime(timer);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function formatTime(t) {
    const m = String(Math.floor(t / 60)).padStart(2, "0");
    const s = String(t % 60).padStart(2, "0");
    return `${m}:${s}`;
}

/* ---------- RESTO DO SEU CÓDIGO ORIGINAL + SISTEMA DE PONTOS ---------- */

const sudokuContainer = document.getElementById("sudoku-container");
const message = document.getElementById("message");
const pencilBtn = document.getElementById("pencil-btn");
const eraserBtn = document.getElementById("eraser-btn");
const hintBtn = document.getElementById("hint-btn");
const errorCounterDisplay = document.getElementById("error-counter");
const endOptions = document.getElementById("end-options");
const retryBtn = document.getElementById("retry-btn");
const anotherBtn = document.getElementById("another-btn");
const newBtn = document.getElementById("new");
const numButtonsDiv = document.getElementById("num-buttons");

let puzzle = [];
let solution = [];
let selectedCell = null;
let errors = 0;
let gameOver = false;
let mode = "normal";
let initialPuzzle = [];

/* CHECAR VITÓRIA */
function checkWin() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const val = parseInt(getValue(r, c));
            if (val !== solution[r][c]) return false;
        }
    }
    return true;
}

const winModal = document.getElementById("win-modal");
const winRestart = document.getElementById("win-restart");

function openWinModal() {
    gameOver = true;
    stopTimer();

    winScore.textContent = "⭐ Pontuação Final: " + score;
    winTime.textContent = "⏱ Tempo Total: " + formatTime(timer);

    document.querySelectorAll(".cell").forEach(c => c.style.pointerEvents = "none");
    winModal.style.display = "flex";
}

winRestart.addEventListener("click", () => {
    winModal.style.display = "none";
    newGame();
});

/* GERAR SUDOKU */
function generateSolvedSudoku() {
  const grid = Array(9).fill(null).map(()=>Array(9).fill(0));
  function isSafe(row,col,num){
    for(let x=0;x<9;x++){
      if(grid[row][x]===num||grid[x][col]===num) return false;
    }
    const startRow=row-(row%3), startCol=col-(col%3);
    for(let r=0;r<3;r++) for(let c=0;c<3;c++)
      if(grid[startRow+r][startCol+c]===num) return false;
    return true;
  }
  function fillGrid(row=0,col=0){
    if(row===9) return true;
    const nextRow=col===8?row+1:row;
    const nextCol=col===8?0:col+1;
    const nums=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-0.5);
    for(let num of nums){
      if(isSafe(row,col,num)){
        grid[row][col]=num;
        if(fillGrid(nextRow,nextCol)) return true;
        grid[row][col]=0;
      }
    }
    return false;
  }
  fillGrid();
  return grid;
}

function removeNumbers(grid,difficulty=0.55){
  const newGrid = grid.map(r=>[...r]);
  for(let row=0;row<9;row++) for(let col=0;col<9;col++)
    if(Math.random()<difficulty) newGrid[row][col]=0;
  return newGrid;
}

/* ATUALIZA STATUS DOS BOTÕES DE NÚMEROS */
function updateNumberButtonsStatus() {
    const count = Array(10).fill(0);

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const val = parseInt(getValue(r, c));
            if (val && val === solution[r][c]) count[val]++;
        }
    }

    document.querySelectorAll("#num-buttons button").forEach(btn => {
        const n = parseInt(btn.textContent);
        if (count[n] === 9) btn.classList.add("complete");
        else btn.classList.remove("complete");
    });
}

/* NOVO JOGO */
function newGame(useSame=false){
  if(useSame && initialPuzzle.length>0){
    puzzle = initialPuzzle.map(r=>[...r]);
  } else {
    solution = generateSolvedSudoku();
    puzzle = removeNumbers(solution,0.55);
    initialPuzzle = puzzle.map(r=>[...r]);
  }

  selectedCell=null;
  errors=0;
  gameOver=false;
  mode="normal";
  score = 0;

  scoreDisplay.textContent = "Pontuação: 0";
  timerDisplay.textContent = "Tempo: 00:00";

  errorCounterDisplay.textContent="Erros: 0 / 3";
  message.textContent="";
  endOptions.classList.add("hidden");
  winModal.style.display = "none";

  startTimer();
  createBoard();
  createNumButtons();
  updateNumberButtonsStatus();
}

function createBoard(){
  sudokuContainer.innerHTML="";
  for(let row=0;row<9;row++){
    for(let col=0;col<9;col++){
      const cell=document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row=row;
      cell.dataset.col=col;
      cell.dataset.value = puzzle[row][col] || "";
      cell.dataset.pencil = "";
      cell.dataset.fixed = puzzle[row][col] !== 0 ? "true" : "false";
      cell.dataset.locked = "false";

      if(row%3===0) cell.classList.add("top-border");
      if(col%3===0) cell.classList.add("left-border");
      if(col===8) cell.classList.add("right-border");
      if(row===8) cell.classList.add("bottom-border");

      if(puzzle[row][col]!==0){
        cell.textContent=puzzle[row][col];
        cell.style.background="#ddd";
        cell.dataset.locked="true";
      }

      const pencilDiv=document.createElement("div");
      pencilDiv.classList.add("pencil");
      cell.appendChild(pencilDiv);

      cell.addEventListener("click",()=>selectCell(cell));
      sudokuContainer.appendChild(cell);
    }
  }
}

function selectCell(cell){
  if(gameOver) return;
  const all=document.querySelectorAll(".cell");
  all.forEach(c=>c.classList.remove("highlight-line","highlight-same-number","selected"));

  selectedCell=cell;
  const r=parseInt(cell.dataset.row);
  const c=parseInt(cell.dataset.col);
  const val=cell.dataset.value;

  all.forEach(x=>{
    const xr=parseInt(x.dataset.row);
    const xc=parseInt(x.dataset.col);
    if(xr===r||xc===c) x.classList.add("highlight-line");
    if(Math.floor(xr/3)===Math.floor(r/3)&&Math.floor(xc/3)===Math.floor(c/3)) x.classList.add("highlight-line");
    if(val!=="" && x.dataset.value===val) x.classList.add("highlight-same-number");
  });

  cell.classList.add("selected");

  if(mode==="eraser" && cell.dataset.fixed==="false"){
    if(cell.dataset.value!=="" || cell.dataset.pencil !== ""){
      cell.textContent="";
      cell.dataset.value="";
      cell.dataset.pencil="";
      cell.classList.remove("error");
      cell.style.background="#fff";
      updatePencil(cell);
      updateNumberButtonsStatus();
    }
  }
}

document.addEventListener("keydown", e=>{
  if(!selectedCell || gameOver) return;
  const key = e.key;
  if(/^[0-9]$/.test(key)) handleInput(parseInt(key));

  const row = parseInt(selectedCell.dataset.row);
  const col = parseInt(selectedCell.dataset.col);
  if(key==="ArrowUp" && row>0){ selectCell(document.querySelector(`.cell[data-row='${row-1}'][data-col='${col}']`)); return; }
  if(key==="ArrowDown" && row<8){ selectCell(document.querySelector(`.cell[data-row='${row+1}'][data-col='${col}']`)); return; }
  if(key==="ArrowLeft" && col>0){ selectCell(document.querySelector(`.cell[data-row='${row}'][data-col='${col-1}']`)); return; }
  if(key==="ArrowRight" && col<8){ selectCell(document.querySelector(`.cell[data-row='${row}'][data-col='${col+1}']`)); return; }

  if(key==="Delete" || key==="Backspace"){
    if(selectedCell.dataset.fixed==="false"){
      selectedCell.textContent="";
      selectedCell.dataset.value="";
      selectedCell.dataset.pencil="";
      selectedCell.classList.remove("error");
      selectedCell.style.background="#fff";
      updatePencil(selectedCell);
      updateNumberButtonsStatus();
    }
  }
});

/* ---- SISTEMA DE PONTUAÇÃO AQUI ---- */
function handleInput(value){
  if(!selectedCell || selectedCell.dataset.fixed==="true") return;
  if(value===0){
    selectedCell.textContent="";
    selectedCell.dataset.value="";
    selectedCell.dataset.pencil="";
    selectedCell.classList.remove("error");
    selectedCell.style.background="#fff";
    updatePencil(selectedCell);
    updateNumberButtonsStatus();
    return;
  }

  if(mode==="pencil"){
    let pencilSet = new Set(selectedCell.dataset.pencil.split("").filter(n=>n));
    if(pencilSet.has(value)) pencilSet.delete(value);
    else pencilSet.add(value);
    selectedCell.dataset.pencil=[...pencilSet].sort().join("");
    updatePencil(selectedCell);
    return;
  }

  const row = parseInt(selectedCell.dataset.row);
  const col = parseInt(selectedCell.dataset.col);

  if(!isValidMove(row,col,value)){
    selectedCell.textContent=value;
    selectedCell.dataset.value=value;
    selectedCell.classList.add("error");
    errors++;
    errorCounterDisplay.textContent=`Erros: ${errors} / 3`;
    if(errors>=3){ endGame(false); }
  } else {
    selectedCell.textContent = value;
    selectedCell.dataset.value = value;
    selectedCell.classList.remove("error");
    selectedCell.dataset.locked = "true";
    selectedCell.style.background = "#fff";
    selectedCell.dataset.pencil = "";

    // ⭐ ADICIONA PONTOS
    score += 10;
    scoreDisplay.textContent = "Pontuação: " + score;
  }

  updateNumberButtonsStatus();

  if (checkWin()) openWinModal();
}

function updatePencil(cell){
  const pencilDiv=cell.querySelector(".pencil");
  pencilDiv.innerHTML="";
  for(let n=1;n<=9;n++){
    if(cell.dataset.pencil.includes(n.toString())){
      const span=document.createElement("span");
      span.textContent=n;
      pencilDiv.appendChild(span);
    }
  }
}

function isValidMove(row,col,num){
  for(let c=0;c<9;c++){
    if(c!==col && parseInt(getValue(row,c))===num) return false;
  }
  for(let r=0;r<9;r++){
    if(r!==row && parseInt(getValue(r,col))===num) return false;
  }
  const startRow = row - row%3;
  const startCol = col - col%3;
  for(let r=startRow;r<startRow+3;r++){
    for(let c=startCol;c<startCol+3;c++){
      if(!(r===row && c===col) && parseInt(getValue(r,c))===num) return false;
    }
  }
  return num === solution[row][col];
}

function getValue(r,c){
  const cell=document.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
  return cell ? cell.dataset.value || 0 : 0;
}

function endGame(win){
  gameOver=true;
  stopTimer();

  document.querySelectorAll(".cell").forEach(c=>c.style.pointerEvents="none");
  endOptions.classList.remove("hidden");

  if(win) message.textContent="🎉 Parabéns! Sudoku completo!";
  else message.textContent="💥 Você perdeu! Atingiu 3 erros.";
}

pencilBtn.addEventListener("click",()=>{
  if(mode==="pencil"){ mode="normal"; pencilBtn.classList.remove("active"); }
  else { mode="pencil"; pencilBtn.classList.add("active"); eraserBtn.classList.remove("active"); }
});

eraserBtn.addEventListener("click",()=>{
  if(mode==="eraser"){ mode="normal"; eraserBtn.classList.remove("active"); }
  else { mode="eraser"; eraserBtn.classList.add("active"); pencilBtn.classList.remove("active"); }
});

retryBtn.addEventListener("click",()=>newGame(true));
anotherBtn.addEventListener("click",()=>newGame());
newBtn.addEventListener("click",()=>newGame());

/* BOTÕES DE NÚMEROS */
function createNumButtons(){
  numButtonsDiv.innerHTML="";
  for(let i=1;i<=9;i++){
    const btn=document.createElement("button");
    btn.textContent=i;
    btn.addEventListener("click",()=>handleInput(i));
    numButtonsDiv.appendChild(btn);
  }
}

/* DICA – sem pontuação */
function revealHint() {
    if (gameOver) return;

    const emptyCells = [];
    document.querySelectorAll(".cell").forEach(cell => {
        if (cell.dataset.fixed === "false" && (cell.dataset.value === "" || !cell.dataset.value)) {
            emptyCells.push(cell);
        }
    });

    if (emptyCells.length === 0) return;

    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);

    const correctValue = solution[r][c];
    cell.dataset.value = correctValue;
    cell.textContent = correctValue;
    cell.dataset.fixed = "true";
    cell.dataset.locked = "true";
    cell.classList.add("revealed-hint");
    cell.style.background = "#d4edda";

    updateNumberButtonsStatus();

    if (checkWin()) openWinModal();
}

hintBtn.addEventListener("click", revealHint);

newGame();