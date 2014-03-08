function new_game() {
}

// function make_move() {
//    var board = get_board();

//    // we found an item! take it!
//    if (board[get_my_x()][get_my_y()] > 0) {
//        return TAKE;
//    }

//    var rand = Math.random() * 4;

//    if (rand < 1) return NORTH;
//    if (rand < 2) return SOUTH;
//    if (rand < 3) return EAST;
//    if (rand < 4) return WEST;

//    return PASS;
// }

// Optionally include this function if you'd like to always reset to a 
// certain board number/layout. This is useful for repeatedly testing your
// bot(s) against known positions.
//
//function default_board_number() {
//    return 123;
//}

function make_move() {
   var board = get_board();

   // we found an item! take it!
   if (board[get_my_x()][get_my_y()] > 0) {
       return TAKE;
   }

   var numFruits = get_number_of_item_types();
   var fruitCount = countFruits();

   //scarcity will determine fruit priority
   var scarcity = determineFruitScarcity(fruitCount);

   determineMoveValues(board, scarcity);

   //moves = get_valid_moves();
   //moves = 

   return PASS;
};

function countFruits() {
   var fruitCount = [];

   for (var type = 1; type <= numFruits; type++) {
      fruitCount.push([type, get_total_item_count(type)]);
   }
   return fruitCount;
};

function determineFruitScarcity(fruitCountArr) {
   var scarcity = fruitCountArr.slice();

   scarcity.sort(function (a,b) {
      if (a[1] < b[1]) {
         return -1;
      } else if (b[1] < a[1]) {
         return 1;
      } else {
         return 0;
      }
   });

   //dup fruit count, and map over it to show only types (first element)
   for (var i = 0; i < scarcity.length; i++) {
      scarcity[i] = scarcity[i][0];
   }
   return scarcity;
};

function determineMoveValues(board, scarcity) {
   reviewedBoard = [];
   for (var r = 0; r < HEIGHT; r++) {
      reviewedBoard.push(new Array(WIDTH));
   }

   //for each tile
   
   //determine fruit values
   determineFruitValues(board, scarcity);

   //determine distance values

   //determine relative values
}

function determineFruitValues(board, scarcity) {
   fruitCoords = [];
   var fruirValue = 20;
   var multiplier = 3;

   for (var row = 0; row < HEIGHT; row++) {
      for (var col = 0; col < WIDTH; col++) {
         var givenValue = board[row][col];
         if (givenValue > 0) {
            reviewedBoard[row][col] = 20 + ((scarcity.indexOf(givenValue) + 1) * multiplier);
            fruitCoords.push([row, col]);
         }
      }
   }
}

function determineDistanceValues(board) {
   for (var row = 0; row < HEIGHT; row++) {
      for (var col = 0; col < WIDTH; col++) {
         if (reviewedBoard[row][col] === undefined) reviewedBoard[row][col] = 0;
         reviewedBoard[row][col] += getDistance([row, col], []);
      }
   }
}

function getDistance(origin, destinations) {
   return (coords2[0] - origin[0]) + (coords2[1] - origin[1]);
}