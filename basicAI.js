class ChessAI {
    constructor(color) {
      this.color = color;
      this.pieceSquareTables = {
        [PAWN]: [
          0,  0,  0,  0,  0,  0,  0,  0,
          50, 50, 50, 50, 50, 50, 50, 50,
          10, 10, 20, 30, 30, 20, 10, 10,
          5,  5, 10, 25, 25, 10,  5,  5,
          0,  0,  0, 20, 20,  0,  0,  0,
          5, -5,-10,  0,  0,-10, -5,  5,
          5, 10, 10,-20,-20, 10, 10,  5,
          0,  0,  0,  0,  0,  0,  0,  0
        ],
        [KNIGHT]: [
          -50,-40,-30,-30,-30,-30,-40,-50,
          -40,-20,  0,  0,  0,  0,-20,-40,
          -30,  0, 10, 15, 15, 10,  0,-30,
          -30,  5, 15, 20, 20, 15,  5,-30,
          -30,  0, 15, 20, 20, 15,  0,-30,
          -30,  5, 10, 15, 15, 10,  5,-30,
          -40,-20,  0,  5,  5,  0,-20,-40,
          -50,-40,-30,-30,-30,-30,-40,-50
        ],
        [BISHOP]: [
          -20,-10,-10,-10,-10,-10,-10,-20,
          -10,  0,  0,  0,  0,  0,  0,-10,
          -10,  0,  5, 10, 10,  5,  0,-10,
          -10,  5,  5, 10, 10,  5,  5,-10,
          -10,  0, 10, 10, 10, 10,  0,-10,
          -10, 10, 10, 10, 10, 10, 10,-10,
          -10,  5,  0,  0,  0,  0,  5,-10,
          -20,-10,-10,-10,-10,-10,-10,-20
        ],
        [ROOK]: [
           0,  0,  0,  0,  0,  0,  0,  0,
           5, 10, 10, 10, 10, 10, 10,  5,
          -5,  0,  0,  0,  0,  0,  0, -5,
          -5,  0,  0,  0,  0,  0,  0, -5,
          -5,  0,  0,  0,  0,  0,  0, -5,
          -5,  0,  0,  0,  0,  0,  0, -5,
          -5,  0,  0,  0,  0,  0,  0, -5,
           0,  0,  0,  5,  5,  0,  0,  0
        ],
        [QUEEN]: [
          -20,-10,-10, -5, -5,-10,-10,-20,
          -10,  0,  0,  0,  0,  0,  0,-10,
          -10,  0,  5,  5,  5,  5,  0,-10,
           -5,  0,  5,  5,  5,  5,  0, -5,
            0,  0,  5,  5,  5,  5,  0, -5,
          -10,  5,  5,  5,  5,  5,  0,-10,
          -10,  0,  5,  0,  0,  0,  0,-10,
          -20,-10,-10, -5, -5,-10,-10,-20
        ],
        [KING]: [
          -30,-40,-40,-50,-50,-40,-40,-30,
          -30,-40,-40,-50,-50,-40,-40,-30,
          -30,-40,-40,-50,-50,-40,-40,-30,
          -30,-40,-40,-50,-50,-40,-40,-30,
          -20,-30,-30,-40,-40,-30,-30,-20,
          -10,-20,-20,-20,-20,-20,-20,-10,
           20, 20,  0,  0,  0,  0, 20, 20,
           20, 30, 10,  0,  0, 10, 30, 20
        ]
      };
    }
  
    evaluatePosition(board) {
      let score = 0;
      for (let square = 0; square < 64; square++) {
        const piece = board[square];
        if (piece !== EMPTY) {
          const pieceType = piece & PIECE_TYPE_MASK;
          const pieceColor = piece & COLOR_MASK;
          // Material score
          score += this.getPieceValue(pieceType) * (pieceColor === this.color ? 1 : -1);
          // Position score
          score += this.getPieceSquareValue(pieceType, square, pieceColor);
        }
      }
      return score;
    }
  
    getPieceValue(pieceType) {
      const values = {[PAWN]: 100, [KNIGHT]: 320, [BISHOP]: 330, [ROOK]: 500, [QUEEN]: 900, [KING]: 20000};
      return values[pieceType] || 0;
    }
  
    getPieceSquareValue(pieceType, square, pieceColor) {
      if (!this.pieceSquareTables[pieceType]) return 0;
      const table = this.pieceSquareTables[pieceType];
      let index;
      if (pieceColor === WHITE) {
        index = square;
      } else {
        // For Black, we flip the board vertically
        const rank = Math.floor(square / 8);
        const file = square % 8;
        index = (7 - rank) * 8 + file;
      }
      return table[index] * (pieceColor === this.color ? 1 : -1);
    }

    moveToChessNotation(move) {
        const pieceSymbols = {
            [PAWN]: 'p', [KNIGHT]: 'N', [BISHOP]: 'B', 
            [ROOK]: 'R', [QUEEN]: 'Q', [KING]: 'K'
        };
        const piece = this.game.board[move.from] & PIECE_TYPE_MASK;
        const pieceSymbol = pieceSymbols[piece];
        const toSquare = this.indexToSquare(move.to);
        
        console.log("Move:", move, "Piece:", piece, "Symbol:", pieceSymbol, "To:", toSquare);
        
        return `${pieceSymbol} -${toSquare}`;
    }

    makeMove(game) {
        const moves = game.getAllValidMoves(this.color);
        
        let bestMove = null;
        let bestScore = -Infinity;

        const rootNode = {
            label: 'Root',
            children: []
        };

        moves.forEach(move => {
            const moveNotation = game.moveToChessNotation(move);
            
            // Make the move
            const capturedPiece = game.board[move.to];
            game.board[move.to] = game.board[move.from];
            game.board[move.from] = EMPTY;

            // Handle pawn promotion for AI
            if ((game.board[move.to] & PIECE_TYPE_MASK) === PAWN && (move.to < 8 || move.to >= 56)) {
                game.board[move.to] = QUEEN | this.color;
            }

            // Evaluate the position
            const score = this.evaluatePosition(game.board);

            // Create child node for this move
            const childNode = {
                move: moveNotation,
                score: score,
                isBest: false
            };
            rootNode.children.push(childNode);

            // Undo the move
            game.board[move.from] = game.board[move.to];
            game.board[move.to] = capturedPiece;

            // Update best move
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        });

        // Mark the best move in the tree
        rootNode.children.find(child => child.score === bestScore).isBest = true;

        // Update the visualizer
        if (game.aiVisualizer) {
            console.log("Updating AIVisualizer with tree:", rootNode);
            game.aiVisualizer.updateTree(rootNode);
        } else {
            console.warn("AIVisualizer not available");
        }

        return bestMove;
    }

    // Other AI methods like minimax, alpha-beta pruning, etc.
}