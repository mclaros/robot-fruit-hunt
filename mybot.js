function new_game() {
}

function make_move() {
   board = get_board();
   currentCoords = [get_my_x(), get_my_y()];
   opponentCoords = [get_opponent_x(), get_opponent_y()];
   turn = (typeof turn === 'undefined') ? 1 : turn + 1;

   // we found an item! take it!
   if (getTile(board, currentCoords) > 0) {
       return TAKE;
   }

   myAdjacentCoords = getAdjacentCoords(currentCoords);
   maxBoardDimension = Math.max(HEIGHT, WIDTH);
   numFruits = get_number_of_item_types();
   fruitCount = countFruits();

   if (turn == 1) {
      //scarcity will determine fruit priority
      scarcity = determineFruitScarcity(fruitCount);
   }

   //assign 'worthiness' to every tile on board based on their distances
   //  from various targets
   determineMoveValues(board);

   //check to see if we are closer to our closest fruit than opponent
   // to its closest fruit
   if ( closerThanOpponent() ) {
      return interceptOpponent();
   }

   //Once all tiles have been tagged with a value of 'worthiness,'
   // get bot's adjacent tiles and pick the one with the highest worth
   var targetCoords = pickMaxCoords(myAdjacentCoords);
   var direction = determineDirection(targetCoords);
   //debug
   renderReviewedBoard();
   var directions = {1: 'right', 2: 'up', 3: 'left', 4:'down'};

   console.log(directions[direction]);
   //end debug

   return direction;
   // return PASS;
}

function closerThanOpponent() {
   var selfDistToFruit = distanceToClosestFruit(currentCoords);
   var opponentDistToFruit = distanceToClosestFruit(opponentCoords);

   if (selfDistToFruit <= opponentDistToFruit) {
      return true;
   }
   else {
      return false;
   }
}

function interceptOpponent() {
   var destination;
   var minDistance = 999;
   var targetCoords = closestFruitCoords(currentCoords);

   myAdjacentCoords.forEach(function (coords) {
      var currDistance = distanceBetween(coords, targetCoords);
      if (currDistance < minDistance) {
         destination = coords;
      }
   });
   return determineDirection(destination);
}

function determineMoveValues(board) {
   reviewedBoard = buildSubstituteBoard();

   //game is centered around the fruits; find the fruits, and assign them
   // some large value based on their scarcity
   assignFruitValues();

   //for every tile, add to their values according to distance from fruits
   assignDistFromFruitValues();

   assignSurroundingAverages();
}

function countFruits() {
   var fruitCount = [];

   for (var type = 1; type <= numFruits; type++) {
      fruitCount.push([type, get_total_item_count(type)]);
   }
   return fruitCount;
}

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
}

function assignFruitValues(options) {
   fruitCoords = [];
   var options = options || {};
   var fruitValue = options.fruitValue || maxBoardDimension;
   var scarcityMultiplier = options.scarcityMultiplier || 1;

   forEachTile(board, function(tileValue, coords) {
      if (tileValue > 0) {
         var fruitScarcity = scarcityOf(tileValue);
         var valueToAssign = fruitValue + (scarcityMultiplier * fruitScarcity);

         assignTileValue(reviewedBoard, coords, valueToAssign);
         fruitCoords.push(coords);
      }
   });

}

function scarcityOf(fruitType) {
   return scarcity.indexOf(fruitType) + 1;
}

function closestFruitCoords(originCoords) {
   var closestFruit;
   var closestDist = 999;

   for (var i = 0; i < fruitCoords.length; i++) {
      var currDistance = distanceBetween(originCoords, fruitCoords[i]);
      if ( currDistance < closestDist ) {
         closestFruit = fruitCoords[i];
      }
   }
   return closestFruit;
}

function distanceToClosestFruit(originCoords) {
   var closestFruit = closestFruitCoords(originCoords);
   return distanceBetween(originCoords, closestFruit);
}

function assignDistFromFruitValues(options) {
   var options = options || {};
   var reductionAmount = options.reductionAmount || 10;
   var reductionMultiplier = options.reductionMultiplier || 1;
   var netReduction = reductionAmount * reductionMultiplier;

   forEachTile(reviewedBoard, function(tileValue, tileCoords) {
      if ( getTile(board, tileCoords) == 0 ) {
         var closestFruit = closestFruitCoords(tileCoords);
         var fruitType = getTile(board, closestFruit);
         var fruitValue = getTile(reviewedBoard, closestFruit);
         var distToFruit = distanceBetween(tileCoords, closestFruit);
         var reducedVal = fruitValue - (distToFruit * (netReduction / scarcityOf(fruitType)) );
         assignTileValue(reviewedBoard, tileCoords, Math.floor(reducedVal));
      }
   });
}

function assignSurroundingAverages() {
   forEachTile(reviewedBoard, function(tileValue, tileCoords) {
      if (getTile(board, tileCoords) == 0) {
         var valueToAssign = tileValue + Math.floor( averageValuesFromNeighbors(tileCoords) );
         assignTileValue( reviewedBoard, tileCoords, valueToAssign );
      }
   });
}

function averageValuesFromNeighbors (coords, givenBoard) {
   //averages neighboring tiles from 'board'. Calculates using current
   // coords if value > 0
   var givenBoard = (typeof givenBoard === "undefined") ? reviewedBoard : givenBoard;
   var coordsToConsider = getAdjacentCoords(coords);
   var currentVal = getTile(givenBoard, coords);

   // coordsToConsider.push(coords);

   var valSum = 0;
   coordsToConsider.forEach(function(coords) {
      valSum += getTile(givenBoard, coords);
   });
   
   var average = valSum / coordsToConsider.length;
   return average;
}

function distanceBetween(origin, dest) {
   //though irrelevant, assume origin and dest coords are [x,y] format
   return Math.abs(dest[1] - origin[1]) + Math.abs(dest[0] - origin[0]);
}

function forEachTile(board, callback) {
   for (var x = 0; x < WIDTH; x++) {
      for (var y = 0; y < HEIGHT;  y++) {
         callback(board[x][y], [x, y]);
      }
   }
}

function fanOutFrom(board, originCoords, callback, alreadyChecked) {
   //Start at origin, and perform callback to adjacent tiles,
   // then recursively do the same to each of their adjacent tiles

   //To save some checks, keep track of tiles that have been traversed
   // so as to not double-check every tile.
   var alreadyChecked = (typeof alreadyChecked === "undefined") ? {} : alreadyChecked;

   var adjacentMoves = getAdjacentCoords(originCoords);
   if (adjacentMoves.length == 0) return;

   adjacentMoves.forEach(function (adjCoords) {
      //Note that in JS, referencing objectLiteral = {} like so: objectLiteral[[a,b]]
      // is equivalent to referencing objectLiteral['a,b']; the array is joined to string
      if ( alreadyChecked[adjCoords] ) {
         return true; //skip this iteration
      }

      callback(getTile(board, adjCoords), adjCoords);
      alreadyChecked[adjCoords] = true;
      fanOutFrom(board, adjCoords, callback, alreadyChecked);
   });
}

function getAdjacentCoords(originCoords) {
   //originCoords must be [x,y] format
   var originX = originCoords[0];
   var originY = originCoords[1];
   var adjacent = [];
   var moves = [];
   
   moves.push([originX - 1, originY]);
   moves.push([originX + 1, originY]);
   moves.push([originX, originY + 1]);
   moves.push([originX, originY - 1]);

   moves.forEach(function(moveCoords) {
      if ( isWithinBoard(moveCoords) ) {
         adjacent.push(moveCoords);
      }
   });

   return adjacent;
}

function isWithinBoard(coords) {
   //coords must be given in [x,y] format
   var xCoord = coords[0];
   var yCoord = coords[1];

   if ( (xCoord >= 0) && (xCoord < WIDTH) ) {
      if ( (yCoord >= 0) && (yCoord < HEIGHT) ) {
         return true;
      }
   }

   return false;
}

function buildSubstituteBoard(options) {
   var options = options || {};
   var initialValue = options.initialValue || 0;
   var substitute = [];

   for (var x = 0; x < WIDTH; x++) {
      var newRow = [];

      for (var y = 0; y < HEIGHT; y++) {
         newRow.push(initialValue);
      }

      substitute.push(newRow);
   }

   return substitute;
}

function assignTileValue(matrix, coords, value) {
   // coords must be given in [x,y] format
   matrix[coords[0]][coords[1]] = value;
}

function getTile(matrix, coords) {
   // coords must be given in [x,y] format
   return matrix[coords[0]][coords[1]];
}

function pickMaxCoords(coordsArray) {
   var coordsValues = [];

   coordsArray.forEach(function(coords) {
      coordsValues.push(getTile(reviewedBoard, coords));
   });

   var maxValueCoords = Math.max.apply(Math, coordsValues);
   var maxValueIndex = coordsValues.indexOf(maxValueCoords);
   return coordsArray[maxValueIndex];
}

function determineDirection(coords) {
   //assuming coords are [x,y] format
   var givenX = coords[0];
   var givenY = coords[1];
   var myX = currentCoords[0];
   var myY = currentCoords[1];
   if (givenX < myX) {
      return WEST;
   }
   else if (givenX > myX) {
      return EAST;
   }
   else if (givenY > myY) {
      return SOUTH;
   }
   else if (givenY < myY) {
      return NORTH;
   }
}

//// VISUAL DEBUG ABUSING JQUERY!
function renderReviewedBoard() {
   $("#reviewedBoard").remove();

   var boardHeight = (HEIGHT * 50) + 15;
   var boardWidth = (WIDTH * 50) + 15;
   var $boardDiv = $("<div>");
   $boardDiv.css({
      padding: 0,
      height: boardHeight,
      width: boardWidth,
   });
   $boardDiv.attr({
      id: "reviewedBoard"
   });
   var $tile = $("<div>");
   $tile.css({
      border: "1px solid black",
      margin: 0,
      float: "left",
      height: "50px",
      width: "50px",
      "font-size": 11
   });

   forEachTile(reviewedBoard, function(tile, tileCoords) {
      var $newTile = $tile.clone();
      $newTile.attr("id", tileCoords.join(","));
      $newTile.html(tile);
      $boardDiv.append($newTile);
   });

   $("body").append($boardDiv);
}