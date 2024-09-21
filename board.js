// Constants for piece types and colors
const EMPTY = 0;
const PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6;
const WHITE = 8, BLACK = 16;
const PIECE_TYPE_MASK = 0b00000111;  // 7
const COLOR_MASK = 0b00011000;
const INFO_MASK = 0b11100000;  

const MOVED = 32;  // Bit 5: Has the piece moved?
const EN_PASSANT_VULNERABLE = 64;  // Bit 6: Is this pawn vulnerable to en passant?
const CASTLING_RIGHTS = 128;    // 24 (covering both WHITE and BLACK)

class ChessBoard {
  constructor() {
    console.log("Initializing ChessBoard");
    this.board = new Uint8Array(64);
    this.previousPosition = [];

    this.initializeBoard();
    this.currentPlayer = WHITE;
    this.enPassantTarget = null;
    this.whiteCaptured = [];
    this.blackCaptured = [];
    this.selectedPiece = null;
    this.boardElement = document.getElementById('chessBoard');
    this.whiteCapturedElement = document.getElementById('whiteCaptured');
    this.blackCapturedElement = document.getElementById('blackCaptured');
    this.createBoardDOM();
    this.positionHistory = [];

    this.whiteClock = 600; // 10 minutes in seconds
    this.blackClock = 600;
    this.clockInterval = null;
    this.resultDisplay = document.getElementById('result-display');
    this.enPassantTargetHistory = null;
    console.log("board initialized", this.previousPosition.length);
    // Randomly decide if AI plays as white or black
    this.aiColor = Math.random() < 0.5 ? WHITE : BLACK; 
    console.log("AI color chosen:", this.aiColor === WHITE ? "White" : "Black");
    
    if (typeof ChessAI === 'undefined') {
      console.error("ChessAI class is not defined!");
    } else {
      this.aiPlayer = new ChessAI(this.aiColor,3);
      console.log("AI player created");
    }

    console.log(`AI is playing as ${this.aiColor === WHITE ? 'White' : 'Black'}`);

    const aiInfoElement = document.getElementById('ai-info');
    if (aiInfoElement) {
      aiInfoElement.textContent = `AI is playing as ${this.aiColor === WHITE ? 'White' : 'Black'}`;
    } else {
      console.warn("Element with id 'ai-info' not found");
    }

    // If AI is white, make the first move
    if (this.aiColor === WHITE) {
      console.log("AI is white, making first move");
      setTimeout(() => this.makeAIMove(), 500);
    }

    this.aiVisualizer = null;
  }

  initializeBoard() {
    // Set up the initial board state 
    const initialSetup = [
      ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK,
      PAWN, PAWN, PAWN, PAWN, PAWN, PAWN, PAWN, PAWN,
      ...new Array(32).fill(EMPTY),
      PAWN, PAWN, PAWN, PAWN, PAWN, PAWN, PAWN, PAWN,
      ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK
    ];



    for (let i = 0; i < 64; i++) {
      this.board[i] = initialSetup[i] | (i < 16 ? BLACK : i >= 48 ? WHITE : EMPTY);
    }

    this.previousPosition.push(this.board.slice(0));

  }


  getPiece(square) {
    return this.board[square];
  }

  setPiece(square, piece) {
    this.board[square] = piece;
  }

   simulateMove(from, to , maximizingPlayer) {
    const color = maximizingPlayer ? WHITE : BLACK;
  
    const piece = this.board[from];

    if (piece === EMPTY) {
      console.log('No piece at the starting square');
      return false;
    }

    if (!this.isLegalMove(from, to, true)) {
      console.log('Illegal move');
      return false;
    }

    // Handle castling
    if ((piece & PIECE_TYPE_MASK) === KING && Math.abs(from - to) === 2) {
        console.log('castling')
      const direction = (to > from) ? 1 : -1;
      const rookFrom = (direction === 1) ? (from | 7) : (from & 56);
      const rookTo = from + direction;

      this.board[rookTo] = this.board[rookFrom];
      this.board[rookFrom] = EMPTY;
      return this.simulateFinalizeMove(from, to, piece, color);

    }

    // Handle en passant capture
   // Handle en passant capture
   if (((to + (piece & COLOR_MASK ? 8 : -8)) & INFO_MASK) === EN_PASSANT_VULNERABLE) {
    console.log('capturing en passant')
  const capturedPawnSquare = to + (piece & COLOR_MASK ? 8 : -8);
  this.board[capturedPawnSquare] = EMPTY;
}

    // Move the piece
    this.board[to] = piece;
    this.board[from] = EMPTY;

    // Handle pawn promotion
    if ((piece & PIECE_TYPE_MASK) === PAWN && (to < 8 || to >= 56)) {
        console.log('promoting')
        this.board[to] = QUEEN | color;
    } 
     return this.simulateFinalizeMove(from, to, piece, color);
    

  }

  simulateFinalizeMove(from, to, piece, color) {

    // Handle en passant
    this.handleEnPassant(from, to, piece);


    this.updatePositionHistory();
   return this.checkGameEndConditions(true, color);

    // Make AI move if it's AI's turn
  }
  

  movePiece(from, to) {
    console.log(`Moving piece from ${from} to ${to}`);
  console.log('Board before move:', this.board.slice());
  
    const piece = this.board[from];
    const capturedPiece = this.board[to];

    if (piece === EMPTY) {
      console.log('No piece at the starting square');
      return false;
    }

    if (!this.isLegalMove(from, to)) {
      console.log('Illegal move');
      return false;
    }

    // Handle castling
    if ((capturedPiece & PIECE_TYPE_MASK) === KING && Math.abs(from - to) === 2) {
      const direction = (to > from) ? 1 : -1;
      const rookFrom = (direction === 1) ? (from | 7) : (from & 56);
      const rookTo = from + direction;

      this.board[rookTo] = this.board[rookFrom];
      this.board[rookFrom] = EMPTY;
    }

// Handle en passant capture
if (this.board[to + (piece & COLOR_MASK ? 8 : -8)] & EN_PASSANT_VULNERABLE) {
    console.log('capturing en passant')
    const capturedPawnSquare = to + (piece & COLOR_MASK ? 8 : -8);
    this.addCapturedPiece(this.board[capturedPawnSquare]);
    this.board[capturedPawnSquare] = EMPTY;
}

    // Move the piece
    this.board[to] = piece;
    this.board[from] = EMPTY;



    // Handle pawn promotion
    if ((piece & PIECE_TYPE_MASK) === PAWN && (to < 8 || to >= 56)) {
      this.handlePromotion(to).then(() => {
        this.finalizeMove(from, to, piece, capturedPiece);
      });
    }
     return this.finalizeMove(from, to, piece, capturedPiece);
    

   
  }

  finalizeMove(from, to, piece, capturedPiece) {
    // Handle en passant
    this.handleEnPassant(from, to, piece);

    // Update game state
    this.lastMove = { from, to, piece, capturedPiece };
    
    

    if (capturedPiece !== EMPTY) {
      this.addCapturedPiece(capturedPiece);
    }

    this.updatePositionHistory();
    this.checkGameEndConditions();
    this.updateBoardDOM();

    this.switchTurn();
    // Make AI move if it's AI's turn
    if (this.currentPlayer === this.aiColor) {
      console.log("AI is making a move");
      setTimeout(() => this.makeAIMove(), 500);
    }
  }

  handlePromotion(square,simulate) {
    return new Promise((resolve) => {
      const color = this.board[square] & COLOR_MASK;
      console.log('ready to promote')
      // If it's the AI's turn, automatically promote to queen
      if (color === this.aiColor || simulate) {
        console.log("promoting")
        this.board[square] = QUEEN | color;
        resolve();
        return;
      }

      const promotionPieces = [QUEEN, ROOK, BISHOP, KNIGHT];
      
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.background = 'white';
      modal.style.padding = '20px';
      modal.style.border = '1px solid black';
      modal.style.zIndex = '1000';

      const pieceNames = {
        [QUEEN]: 'Queen',
        [ROOK]: 'Rook',
        [BISHOP]: 'Bishop',
        [KNIGHT]: 'Knight'
      };

      promotionPieces.forEach(pieceType => {
        const button = document.createElement('button');
        button.textContent = pieceNames[pieceType];
        button.onclick = () => {
          this.board[square] = pieceType | color;
          document.body.removeChild(modal);
          resolve();
        };
        modal.appendChild(button);
      });

      document.body.appendChild(modal);
    });
  }

  handleEnPassant(from, to, piece) {
    
 
for (let i = 0; i < 64; i++) {
  if (this.board[i] & INFO_MASK === EN_PASSANT_VULNERABLE) {
    this.board[i] = this.board[i] & ~EN_PASSANT_VULNERABLE;
  }
}


    // Set new en passant target if applicable
    if ((piece & PIECE_TYPE_MASK) === PAWN && Math.abs(from - to) === 16) {
        this.board[to] |= EN_PASSANT_VULNERABLE;
      }
  }

  checkGameEndConditions(simulate , color) {

     if(!color ) {
        color = this.currentPlayer;
    }
    let opponentColor = color === WHITE ? BLACK : WHITE;
    if (this.isInCheck(opponentColor)) {
      if (this.isCheckmate(opponentColor)) {
        if (simulate) {
          console.log("Checkmate! ", color === WHITE ? 'Black' : 'White', "wins!");
          return 'end node';
        }
        console.log(`Checkmate! ${color === WHITE ? 'Black' : 'White'} wins!`);
        this.endGame(`${color === WHITE ? 'Black' : 'White'} wins by checkmate!`);
      } else {
        console.log(`${opponentColor === WHITE ? 'White' : 'Black'} is in check!`);
      }
    } else {
      if (this.isStalemate(opponentColor)) {
        if (simulate) {
          console.log("Stalemate! ", color === WHITE ? 'Black' : 'White', "wins!");
          return 'end node';
        }
        this.endGame('Draw by stalemate!');
      } else if (this.isInsufficientMaterial()) {
        if (simulate) {
          return 'end node';
        }
        this.endGame('Draw by insufficient material!');
      } else if (this.isThreefoldRepetition()) {
        if (simulate) {
          console.log("Draw by threefold repetition!");
          return 'end node';
        }
        this.endGame('Draw by threefold repetition!');
      }
    }
    return true
  }

  checkForDraw() {
    const currentPosition = this.board.join(',');
    const positionCount = this.positionHistory.filter(position => position === currentPosition).length;
    if (positionCount >= 3) {
      console.log("Threefold repetition! Players can claim a draw.");
      // You might want to implement a way for players to claim the draw here
    }
  }

  updatePositionHistory() {
    console.log('updating position history')
    const currentPosition = this.board.join(',');
    this.positionHistory.push(currentPosition);
    const currentPositionBoard = this.board.slice(0);
    this.previousPosition.push(currentPositionBoard);
  }

  getValidMoves(square) {
    const piece = this.board[square];
    const pieceType = piece & PIECE_TYPE_MASK;
    const pieceColor = piece & COLOR_MASK;

    let moves = [];
    switch (pieceType) {
      case PAWN:
        moves = this.getPawnMoves(square, pieceColor);
        break;
      case KNIGHT:
        moves = this.getKnightMoves(square, pieceColor);
        break;
      case BISHOP:
        moves = this.getBishopMoves(square, pieceColor);
        break;
      case ROOK:
        moves = this.getRookMoves(square, pieceColor);
        break;
      case QUEEN:
        moves = [...this.getBishopMoves(square, pieceColor), ...this.getRookMoves(square, pieceColor)];
        break;
      case KING:
        moves = this.getKingMoves(square, pieceColor);
        break;
    }

    // Filter out moves that would leave the king in check
    return moves.filter(move => !this.moveWouldExposeCheck(square, move, pieceColor));
  }

  getKingMoves(square, color) {
    const moves = [];
    const directions = [1, -1, 8, -8, 9, -9, 7, -7];

    directions.forEach(direction => {
      const targetSquare = square + direction;
      if (targetSquare >= 0 && targetSquare < 64 &&
          Math.abs((targetSquare % 8) - (square % 8)) <= 1) {
        if (this.isSquareEmpty(targetSquare) || this.isPieceColor(targetSquare, color === WHITE ? BLACK : WHITE)) {
          moves.push(targetSquare);
        }
      }
    });

    // Add castling moves without checking for check (we'll do that later)
    if (!this.hasKingMoved(color)) {
      // Kingside castling
      if (!this.hasRookMoved(color, true) && 
          this.isSquareEmpty(square + 1) && 
          this.isSquareEmpty(square + 2)) {
        moves.push(square + 2);
      }
      // Queenside castling
      if (!this.hasRookMoved(color, false) && 
          this.isSquareEmpty(square - 1) && 
          this.isSquareEmpty(square - 2) &&
          this.isSquareEmpty(square - 3)) {
        moves.push(square - 2);
      }
    }

    return moves;
  }

  moveWouldExposeCheck(from, to, color) {
    const originalTo = this.board[to];
    const originalFrom = this.board[from];
    this.board[to] = this.board[from];
    this.board[from] = EMPTY;

    const inCheck = this.isInCheck(color);

    this.board[from] = originalFrom;
    this.board[to] = originalTo;

    return inCheck;
  }

  isInCheck(color) {
    const kingSquare = this.findKing(color);
    const opponentColor = color === WHITE ? BLACK : WHITE;

    for (let square = 0; square < 64; square++) {
      if (this.isPieceColor(square, opponentColor)) {
        const moves = this.getValidMovesWithoutCheckCheck(square);
        if (moves.includes(kingSquare)) {
          return true;
        }
      }
    }
    return false;
  }

  findKing(color) {
    return this.board.findIndex(square => 
      (square & PIECE_TYPE_MASK) === KING && (square & COLOR_MASK) === color
    );
  }

  getValidMovesWithoutCheckCheck(square) {
    const piece = this.board[square];
    const pieceType = piece & PIECE_TYPE_MASK;
    const pieceColor = piece & COLOR_MASK;

    switch (pieceType) {
      case PAWN:
        return this.getPawnMoves(square, pieceColor);
      case KNIGHT:
        return this.getKnightMoves(square, pieceColor);
      case BISHOP:
        return this.getBishopMoves(square, pieceColor);
      case ROOK:
        return this.getRookMoves(square, pieceColor);
      case QUEEN:
        return [...this.getBishopMoves(square, pieceColor), ...this.getRookMoves(square, pieceColor)];
      case KING:
        return this.getKingMoves(square, pieceColor);
      default:
        return [];
    }
  }

  isLegalMove(from, to, simulate) {
    const piece = this.board[from];
    const pieceColor = piece & COLOR_MASK;

    if (pieceColor !== this.currentPlayer && !simulate) {
      return false;
    }

    const validMoves = this.getValidMoves(from);
    return validMoves.includes(to);
  }

  switchTurn() {
    this.currentPlayer = this.currentPlayer === WHITE ? BLACK : WHITE;
    // Update the active clock display
    document.getElementById('white-clock').classList.toggle('active', this.currentPlayer === WHITE);
    document.getElementById('black-clock').classList.toggle('active', this.currentPlayer === BLACK);
  }

  hasKingMoved(color) {
    const kingStartSquare = color === WHITE ? 60 : 4;
    return this.board[kingStartSquare] !== (KING | color);
  }

  hasRookMoved(color, kingSide) {
    const rookStartSquare = color === WHITE ? (kingSide ? 63 : 56) : (kingSide ? 7 : 0);
    return this.board[rookStartSquare] !== (ROOK | color);
  }

  isSquareAttacked(square, defendingColor) {
    const attackingColor = defendingColor === WHITE ? BLACK : WHITE;
    for (let i = 0; i < 64; i++) {
      if (this.isPieceColor(i, attackingColor)) {
        const moves = this.getValidMovesWithoutCheckCheck(i);
        if (moves.includes(square)) {
          return true;
        }
      }
    }
    return false;
  }

  isSquareEmpty(square) {
    return this.board[square] === EMPTY;
  }

  isPieceColor(square, color) {
    const piece = this.board[square];
    return piece !== EMPTY && (piece & COLOR_MASK) === color;
  }

  getPawnMoves(square, color) {
    const moves = [];
    const direction = color === WHITE ? -8 : 8;
    const startRank = color === WHITE ? 6 : 1;

    // Forward move
    if (this.isSquareEmpty(square + direction)) {
      moves.push(square + direction);
      // Double move from starting position
      if (Math.floor(square / 8) === startRank && this.isSquareEmpty(square + 2 * direction)) {
        moves.push(square + 2 * direction);
      }
    }

    // Regular captures
    [-1, 1].forEach(lateral => {
      const captureSquare = square + direction + lateral;
      if (captureSquare >= 0 && captureSquare < 64 && 
          Math.abs((captureSquare % 8) - (square % 8)) === 1) {
        if (this.isPieceColor(captureSquare, color === WHITE ? BLACK : WHITE)) {
          moves.push(captureSquare);
        }
        // En passant capture
        if ((this.board[square + (color === WHITE ? -1 : 1)] & EN_PASSANT_VULNERABLE) === EN_PASSANT_VULNERABLE) {
            moves.push(captureSquare);
          }
        
      }
    });

    return moves;
  }

  getRookMoves(square, color) {
    const moves = [];
    const directions = [1, -1, 8, -8];

    directions.forEach(direction => {
      let targetSquare = square + direction;
      while (targetSquare >= 0 && targetSquare < 64 &&
             Math.abs((targetSquare % 8) - ((targetSquare - direction) % 8)) <= 1) {
        if (this.isSquareEmpty(targetSquare)) {
          moves.push(targetSquare);
        } else {
          if (this.isPieceColor(targetSquare, color === WHITE ? BLACK : WHITE)) {
            moves.push(targetSquare);
          }
          break;
        }
        targetSquare += direction;
      }
    });

    return moves;
  }

  getBishopMoves(square, color) {
    const moves = [];
    const directions = [ 9, -9, 7, -7];

    directions.forEach(direction => {
      let targetSquare = square + direction;
      while (targetSquare >= 0 && targetSquare < 64 &&
             Math.abs((targetSquare % 8) - ((targetSquare - direction) % 8)) <= 1) {
        if (this.isSquareEmpty(targetSquare)) {
          moves.push(targetSquare);
        } else {
          if (this.isPieceColor(targetSquare, color === WHITE ? BLACK : WHITE)) {
            moves.push(targetSquare);
          }
          break;
        }
        targetSquare += direction;
      }
    });

    return moves;
  }

  getKnightMoves(square, color) {
    const moves = [];
    const directions = [
      -17, -15, -10, -6, 6, 10, 15, 17
    ];

    directions.forEach(direction => {
      const targetSquare = square + direction;
      if (targetSquare >= 0 && targetSquare < 64) {
        const targetFile = targetSquare % 8;
        const currentFile = square % 8;
        
        // Check if the move is within the board and not wrapping around
        if (Math.abs(targetFile - currentFile) <= 2) {
          if (this.isSquareEmpty(targetSquare) || this.isPieceColor(targetSquare, color === WHITE ? BLACK : WHITE)) {
            moves.push(targetSquare);
          }
        }
      }
    });

    return moves;
  }

  getQueenMoves(square, color) {
    return [...this.getRookMoves(square, color), ...this.getBishopMoves(square, color)];
  }

  isCheckmate(color) {
    if (!this.isInCheck(color)) {
      return false;
    }

    // Check if any move can get the king out of check
    for (let square = 0; square < 64; square++) {
      if (this.isPieceColor(square, color)) {
        const moves = this.getValidMovesWithoutCheckCheck(square);
        for (const move of moves) {
          if (!this.moveWouldExposeCheck(square, move, color)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  createBoardDOM() {
    console.log("Creating board DOM");
    this.boardElement.innerHTML = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
        square.dataset.square = row * 8 + col;
        square.addEventListener('dragover', this.handleDragOver.bind(this));
        square.addEventListener('drop', this.handleDrop.bind(this));
        this.boardElement.appendChild(square);
      }
    }
    this.updateBoardDOM();
    this.updateClockDisplay();
    this.startClock();
    console.log("Board DOM created");
  }

  updateBoardDOM() {
    for (let square = 0; square < 64; square++) {
      const piece = this.getPiece(square);
      const squareElement = this.boardElement.querySelector(`[data-square="${square}"]`);
      squareElement.innerHTML = '';
      if (piece !== EMPTY) {
        const pieceElement = this.createPieceElement(piece, square);
        squareElement.appendChild(pieceElement);
      }
    }
    this.updateCapturedPiecesDOM();
  }

  createPieceElement(piece, square) {
    const pieceElement = document.createElement('div');
    pieceElement.className = 'piece';
    pieceElement.draggable = true;
    pieceElement.dataset.piece = piece;
    pieceElement.dataset.square = square;
    pieceElement.addEventListener('dragstart', this.handleDragStart.bind(this));
    
    const pieceType = piece & PIECE_TYPE_MASK;
    const color = piece & WHITE ? 'white' : 'black';
    const pieceNames = ['', 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
    const pieceName = pieceNames[pieceType];
    
    
    const img = new Image();
    img.src = `${color}/${pieceName}.png`;
    img.alt = `${color} ${pieceName}`;
    img.onerror = () => console.error(`Failed to load image: ${img.src}`);
    pieceElement.appendChild(img);
    
    return pieceElement;
  }

  handleDragStart(event) {
    this.selectedPiece = parseInt(event.target.dataset.square);
  }

  handleDragOver(event) {
    event.preventDefault();
  }

  handleDrop(event) {
    event.preventDefault();
    const targetSquare = parseInt(event.target.dataset.square);
    if (this.selectedPiece !== null) {
      const moveSuccessful = this.movePiece(this.selectedPiece, targetSquare);
      if (moveSuccessful) {
        this.updateBoardDOM();
      } else {
        console.log('Invalid move, please try again');
        // Optionally, add visual feedback for invalid move
      }
      this.selectedPiece = null;
    }
  }

  undoMove() {
    if (this.previousPosition.length > 0) { 
      // Remove the current position
     
      this.previousPosition.pop(); 
      const lastPosition = this.previousPosition[this.previousPosition.length - 1];

      this.positionHistory.pop();

    
      this.board = lastPosition.slice(0);
     

      
        // Update the board display
    } else {
      console.log("No more moves to undo",this.positionHistory);
    }
  }

  addCapturedPiece(piece) {
    const capturedColor = piece & COLOR_MASK;
    if (capturedColor === WHITE) {
      this.blackCaptured.push(piece);
    } else {
      this.whiteCaptured.push(piece);
    }
    this.updateCapturedPiecesDOM();
  }

  updateCapturedPiecesDOM() {
    console.log('updateCapturedPiecesDOM',this.blackCaptured,this.whiteCaptured)
    // White pieces are captured by Black, so they go on the Black side
    this.updateCapturedPiecesSide(this.blackCapturedElement, this.whiteCaptured);
    // Black pieces are captured by White, so they go on the White side
    this.updateCapturedPiecesSide(this.whiteCapturedElement, this.blackCaptured);
  }

  updateCapturedPiecesSide(element, capturedPieces) {
    element.innerHTML = '';
    capturedPieces.forEach(piece => {
      const pieceElement = this.createPieceElement(piece, -1);
      pieceElement.draggable = false;
      pieceElement.style.width = '30px';
      pieceElement.style.height = '30px';
      element.appendChild(pieceElement);
    });
  }

  startClock() {
    this.clockInterval = setInterval(() => {
      if (this.currentPlayer === WHITE) {
        this.whiteClock--;
      } else {
        this.blackClock--;
      }
      this.updateClockDisplay();
      
      if (this.whiteClock <= 0) {
        this.endGame('Black wins on time!');
      } else if (this.blackClock <= 0) {
        this.endGame('White wins on time!');
      }
    }, 1000);
  }

  updateClockDisplay() {
    document.getElementById('white-clock').textContent = `White: ${this.formatTime(this.whiteClock)}`;
    document.getElementById('black-clock').textContent = `Black: ${this.formatTime(this.blackClock)}`;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  endGame(result) {
    clearInterval(this.clockInterval);
    this.resultDisplay.textContent = result;
  }

  isStalemate(color) {
    if (this.isInCheck(color)) return false;
    
    for (let square = 0; square < 64; square++) {
      if (this.isPieceColor(square, color)) {
        const moves = this.getValidMovesWithoutCheckCheck(square);
        if (moves.some(move => !this.moveWouldExposeCheck(square, move, color))) {
          return false;
        }
      }
    }
    return true;
  }

  isInsufficientMaterial() {
    const pieces = this.board.filter(square => square !== EMPTY);
    if (pieces.length <= 3) {
      const types = pieces.map(piece => piece & PIECE_TYPE_MASK);
      if (!types.includes(PAWN) && !types.includes(ROOK) && !types.includes(QUEEN)) {
        return true;
      }
    }
    return false;
  }

  isThreefoldRepetition() {
    // Implement threefold repetition check
    // This is a simplified version and might need to be more sophisticated
    const currentPosition = this.board.join(',');
    return this.positionHistory.filter(position => position === currentPosition).length >= 3;
  }

  getAllValidMoves(color) {
    const moves = [];
    for (let square = 0; square < 64; square++) {
      if (this.isPieceColor(square, color)) {
        const validMoves = this.getValidMoves(square);
        validMoves.forEach(to => moves.push({ from: square, to }));
      }
    }
    return moves;
  }

  makeAIMove() {
    console.log('makeAIMove called')
    const bestMove = this.aiPlayer.makeMoveMinMax(this);
    console.log("bestMove", bestMove);
    if (bestMove) {
        this.movePiece(bestMove.from, bestMove.to);
    }
  }

  moveToChessNotation(move) {
    const pieceSymbols = {
      [PAWN]: '', [KNIGHT]: 'N', [BISHOP]: 'B', 
      [ROOK]: 'R', [QUEEN]: 'Q', [KING]: 'K'
    };

    const piece = this.board[move.from] & PIECE_TYPE_MASK;
    const pieceSymbol = pieceSymbols[piece];
    const fromSquare = this.indexToSquare(move.from);
    const toSquare = this.indexToSquare(move.to);
    
    let notation = `${pieceSymbol}${fromSquare}-${toSquare}`;
    
    if (move.capturedPiece) {
        notation = notation.replace('-', 'x');
    }
    
    // Add check or checkmate symbol if applicable
    // This requires additional game state information
    
    return notation;
  }

  indexToSquare(index) {
    const file = 'abcdefgh'[index % 8];
    const rank = 8 - Math.floor(index / 8);
    return `${file}${rank}`;
  }
}


// CSS for the board and pieces
const style = document.createElement('style');
style.textContent = `
  #chessBoard {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    width: 400px;
    height: 400px;
    border: 1px solid black;
  }
  .square {
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .light { background-color: #f0d9b5; }
  .dark { background-color: #b58863; }
  .piece { width: 100%; height: 100%; cursor: grab; }
  .piece img { width: 100%; height: 100%; pointer-events: none; }
  .clock.active {
    color: #007bff;
    text-decoration: underline;
  }
`;
document.head.appendChild(style);