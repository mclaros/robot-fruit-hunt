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
   numFruits = get_number_of_item_types();

   if (turn == 1) {
      fruitCount = countFruits();
      //scarcity will determine fruit priority
      scarcity = determineFruitScarcity(fruitCount);
      maxBoardDimension = Math.max(HEIGHT, WIDTH);
   }

   reviewedBoard = buildSubstituteBoard();

   //Assign each fruit a value
   assignFruitValues();

   //if there are mo fruit near us than near opponent, concentrate those
   var fruitsToConsider = pruneFruit(fruitCoords);

   //target fruit will be the fruit with the highest value
   var targetCoords = acquireTarget(fruitsToConsider);
   // var targetCoords = acquireTarget(fruitCoords);

   var nextStep = closestToTarget(myAdjacentCoords, targetCoords);
   var direction = determineDirection(nextStep);

   //debug
   renderReviewedBoard();
   var directions = {1: 'right', 2: 'up', 3: 'left', 4:'down'};

   console.log(directions[direction]);
   //end debug

   return direction;
}

function acquireTarget(fruitCoords) {
   //first, check if we are next to fruit
   // var surroundingTiles = myAdjacentCoords.concat(getDiagonalCoords(currentCoords));
   var surroundingTiles = nearbyTileCoords(currentCoords, 2);
   var bestNearbyFruit = pickMaxCoords(surroundingTiles);
   if (bestNearbyFruit) {
      return bestNearbyFruit;
   }

   //there are no nearby fruit, so go after highest fruit on board
   return pickMaxCoords(fruitCoords);
}

function pruneFruit(fruitCoords) {
   var fruitsToConsider = []

   fruitCoords.forEach(function(coords) {
      var fruitType = getTile(board, coords);
      if (get_my_item_count(fruitType) <= Math.floor(fruitCount[fruitType - 1][1])) {
         fruitsToConsider.push(coords);
      }
   });
   return fruitsToConsider;
}

function determineFruitScarcity(fruitCountArr) {
   var scarcity = {};
   var sortedCount = fruitCountArr.slice();
   sortedCount.sort(function (a, b) {
      if (a[1] < b[1]) {
         return -1;
      }
      else if (b[1] < a[1]) {
         return 1;
      }
      else {
         return 0;
      }
   });

   //consider scarcity to be 1-indexed
   for (var i = 0; i < sortedCount.length; i++) {
      scarcity[sortedCount[i][0]] = i + 1;
   }
   return scarcity;
}


function countFruits() {
   var fruitCount = [];

   for (var type = 1; type <= numFruits; type++) {
      fruitCount.push([type, get_total_item_count(type)]);
   }
   return fruitCount;
}

function assignFruitValues() {
   fruitCoords = [];

   forEachTile(board, function(tileValue, coords) {
      if (tileValue > 0) {
         var valueToAssign = determineFruitValue(coords);
         assignTileValue(reviewedBoard, coords, valueToAssign);
         fruitCoords.push(coords);
      }
   });
}

function determineFruitValue(coords, options) {
   var options = (typeof options === 'undefined') ? {} : options;
   var scarcityMultiplier = options.scarcityMultiplier || 2;
   var fruitType = getTile(board, coords);
   var fruitScarcity = scarcity[fruitType];
   var fruitValue = fruitScarcity * scarcityMultiplier;

   //add value to fruit near other fruit
   fruitValue += averageNearbyScarcity(coords, 3) * scarcityMultiplier;

   //add value to fruit if enemy has more of fruit type than self
   if (get_opponent_item_count(fruitType) >= get_my_item_count(fruitType)) {
      fruitValue += scarcityMultiplier;
   }

   return fruitValue;
}

function averageNearbyScarcity(origin, maxDistance) {
   var scarcityValueSum = 0;
   var nearbyFruitCount = 0;
   var nearbyTiles = nearbyTileCoords(origin, maxDistance);

   nearbyTiles.forEach(function(coords) {
      var tileValue = getTile(board, coords);
      scarcityValueSum += tileValue;
      nearbyFruitCount += 1;
   });
   return scarcityValueSum / nearbyFruitCount;
}

function nearbyTileCoords(origin, maxDistance) {
   var minX = Math.max((origin[0] - maxDistance), 0);
   var maxX = Math.min((origin[0] + maxDistance), (WIDTH - 1));
   var minY = Math.max((origin[1] - maxDistance), 0);
   var maxY = Math.min((origin[1] + maxDistance), (HEIGHT - 1));
   var nearbyCoords = [];

   for (var x = minX; x <= maxX; x++) {
      for (var y = minY; y <= maxY; y++) {
         var currentCoords = [x,y];
         if (distanceBetween(origin, currentCoords) <= maxDistance) {
            if (currentCoords != origin) nearbyCoords.push(currentCoords);
         }
      }
   }
   return nearbyCoords;
}

function distanceBetween(origin, dest) {
   //though irrelevant, assume origin and dest coords are [x,y] format
   return Math.abs(dest[1] - origin[1]) + Math.abs(dest[0] - origin[0]);
}

function closestToTarget(coordChoices, target) {
   var closestCoords;
   var minDistance = 999;

   coordChoices.forEach(function(coords) {
      var currentDistance = distanceBetween(coords, target);
      if (currentDistance < minDistance) {
         closestCoords = coords;
         minDistance = currentDistance;
      }
   });
   return closestCoords;
}

function forEachTile(board, callback) {
   for (var x = 0; x < WIDTH; x++) {
      for (var y = 0; y < HEIGHT;  y++) {
         callback(board[x][y], [x, y]);
      }
   }
}

function getDiagonalCoords(originCoords) {
   //originCoords must be [x,y] format
   var originX = originCoords[0];
   var originY = originCoords[1];
   var diagonal = [];
   var moves = [];
   
   moves.push([originX - 1, originY - 1]);
   moves.push([originX - 1, originY + 1]);
   moves.push([originX + 1, originY - 1]);
   moves.push([originX + 1, originY + 1]);

   moves.forEach(function(moveCoords) {
      if ( isWithinBoard(moveCoords) ) {
         diagonal.push(moveCoords);
      }
   });

   return diagonal;
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
   var options = (typeof options === 'undefined') ? {} : options;
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
   var maxCoords;
   var maxValue = 0;

   coordsArray.forEach(function(coords) {
      var currentValue = getTile(reviewedBoard, coords);
      if (currentValue > maxValue) {
         maxCoords = coords;
         maxValue = currentValue;
      }
   });

   return maxCoords;
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
