/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2019 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview An object representing a single row on a rendered block and all
 * of its subcomponents.
 * @author fenichel@google.com (Rachel Fenichel)
 */

goog.provide('Blockly.blockRendering.BottomRow');
goog.provide('Blockly.blockRendering.InputRow');
goog.provide('Blockly.blockRendering.Row');
goog.provide('Blockly.blockRendering.SpacerRow');
goog.provide('Blockly.blockRendering.TopRow');

goog.require('Blockly.blockRendering.constants');
goog.require('Blockly.blockRendering.Input');
goog.require('Blockly.blockRendering.InRowSpacer');
goog.require('Blockly.blockRendering.Measurable');
goog.require('Blockly.blockRendering.NextConnection');
goog.require('Blockly.blockRendering.PreviousConnection');
goog.require('Blockly.RenderedConnection');

/**
 * An object representing a single row on a rendered block and all of its
 * subcomponents.
 * @package
 * @constructor
 */
Blockly.blockRendering.Row = function() {
  /**
   * The type of this rendering object.
   * @package
   * @type {string}
   */
  this.type = 'row';

  /**
   * An array of elements contained in this row.
   * @package
   * @type {!Array.<!Blockly.blockRendering.Measurable>}
   */
  this.elements = [];

  /**
   * The height of the row.
   * @package
   * @type {number}
   */
  this.height = 0;

  /**
   * The width of the row, from the left edge of the block to the right.
   * Does not include child blocks unless they are inline.
   * @package
   * @type {number}
   */
  this.width = 0;

  /**
   * The minimum height of the row.
   * @package
   * @type {number}
   */
  this.minHeight = 0;

  /**
   * The minimum width of the row, from the left edge of the block to the right.
   * Does not include child blocks unless they are inline.
   * @package
   * @type {number}
   */
  this.minWidth = 0;

  /**
   * The width of the row, from the left edge of the block to the edge of the
   * block or any connected child blocks.
   * @package
   * @type {number}
   */
  this.widthWithConnectedBlocks = 0;

  /**
   * The Y position of the row relative to the origin of the block's svg group.
   * @package
   * @type {number}
   */
  this.yPos = 0;

  /**
   * The X position of the row relative to the origin of the block's svg group.
   * @package
   * @type {number}
   */
  this.xPos = 0;

  /**
   * Whether the row has any external inputs.
   * @package
   * @type {boolean}
   */
  this.hasExternalInput = false;

  /**
   * Whether the row has any statement inputs.
   * @package
   * @type {boolean}
   */
  this.hasStatement = false;

  /**
   * Whether the row has any inline inputs.
   * @package
   * @type {boolean}
   */
  this.hasInlineInput = false;

  /**
   * Whether the row has any dummy inputs.
   * @package
   * @type {boolean}
   */
  this.hasDummyInput = false;

  /**
   * Whether the row has a jagged edge.
   * @package
   * @type {boolean}
   */
  this.hasJaggedEdge = false;
};

/**
 * The shape object to use when drawing previous and next connections.
 * TODO (#2803): Formalize type annotations for these objects.
 * @type {Object}
 */
Blockly.blockRendering.Row.prototype.notchShape =
    Blockly.blockRendering.constants.NOTCH;

/**
 * Inspect all subcomponents and populate all size properties on the row.
 * @package
 */
Blockly.blockRendering.Row.prototype.measure = function() {
  throw Error('Unexpected attempt to measure a base Row.');
};

/**
 * Get the last input on this row, if it has one.
 * TODO: Consider moving this to InputRow, if possible.
 * @return {Blockly.blockRendering.Input} The last input on the row, or null.
 * @package
 */
Blockly.blockRendering.Row.prototype.getLastInput = function() {
  for (var i = this.elements.length - 1; i >= 0; i--) {
    var elem = this.elements[i];
    if (elem.isSpacer()) {
      continue;
    }
    if (elem.isInput) {
      return /** @type {Blockly.blockRendering.Input} */ (elem);
    } else if (elem.isField()) {
      return /** @type {Blockly.blockRendering.Input} */ (elem.parentInput);
    }
  }
  return null;
};

/**
 * Convenience method to get the first spacer element on this row.
 * @return {Blockly.blockRendering.InRowSpacer} The first spacer element on
 *   this row.
 * @package
 */
Blockly.blockRendering.Row.prototype.getFirstSpacer = function() {
  for (var i = 0, elem; elem = this.elements[i]; i++) {
    if (elem.isSpacer) {
      return /** @type {Blockly.blockRendering.InRowSpacer} */ (elem);
    }
  }
  return null;
};

/**
 * Convenience method to get the last spacer element on this row.
 * @return {Blockly.blockRendering.InRowSpacer} The last spacer element on
 *   this row.
 * @package
 */
Blockly.blockRendering.Row.prototype.getLastSpacer = function() {
  for (var i = this.elements.length - 1, elem; elem = this.elements[i]; i--) {
    if (elem.isSpacer) {
      return /** @type {Blockly.blockRendering.InRowSpacer} */ (elem);
    }
  }
  return null;
};

/**
 * An object containing information about what elements are in the top row of a
 * block as well as sizing information for the top row.
 * Elements in a top row can consist of corners, hats, spacers, and previous
 * connections.
 * After this constructor is called, the row will contain all non-spacer
 * elements it needs.
 * @param {!Blockly.BlockSvg} block The block for which this represents the top
 *     row.
 * @package
 * @constructor
 * @extends {Blockly.blockRendering.Row}
 */
Blockly.blockRendering.TopRow = function() {
  Blockly.blockRendering.TopRow.superClass_.constructor.call(this);

  this.type = 'top row';

  /**
   * The starting point for drawing the row, in the y direction.
   * This allows us to draw hats and simliar shapes that don't start at the
   * origin. Must be non-negative (see #2820).
   * @package
   * @type {number}
   */
  this.startY = 0;

  /**
   * Whether the block has a previous connection.
   * @package
   * @type {boolean}
   */
  this.hasPreviousConnection = false;

  /**
   * The previous connection on the block, if any.
   * @type {Blockly.BlockRendering.PreviousConnection}
   */
  this.connection = null;
};
goog.inherits(Blockly.blockRendering.TopRow, Blockly.blockRendering.Row);

/**
 * Create all non-spacer elements that belong on the top row.
 * @param {!Blockly.BlockSvg} block The block whose top row this represents.
 * @package
 */
Blockly.blockRendering.TopRow.prototype.populate = function(block) {
  var hasHat = block.hat ? block.hat === 'cap' : Blockly.BlockSvg.START_HAT;
  var hasPrevious = !!block.previousConnection;
  var prevBlock = block.getPreviousBlock();
  var squareCorner = !!block.outputConnection ||
      hasHat || (prevBlock && prevBlock.getNextBlock() == block);

  if (squareCorner) {
    this.elements.push(new Blockly.blockRendering.SquareCorner());
  } else {
    this.elements.push(new Blockly.blockRendering.RoundCorner());
  }

  if (hasHat) {
    var hat = new Blockly.blockRendering.Hat();
    this.elements.push(hat);
    this.startY = hat.startY;
  } else if (hasPrevious) {
    this.hasPreviousConnection = true;
    this.connection = new Blockly.blockRendering.PreviousConnection(
        /** @type {Blockly.RenderedConnection} */ (block.previousConnection));
    this.elements.push(this.connection);
  }

  var precedesStatement = block.inputList.length &&
      block.inputList[0].type == Blockly.NEXT_STATEMENT;

  // This is the minimum height for the row. If one of its elements has a
  // greater height it will be overwritten in the compute pass.
  if (precedesStatement && !block.isCollapsed()) {
    this.minHeight = Blockly.blockRendering.constants.LARGE_PADDING;
  } else {
    this.minHeight = Blockly.blockRendering.constants.MEDIUM_PADDING;
  }
};

/**
 * @override
 */
Blockly.blockRendering.TopRow.prototype.measure = function() {
  this.width = this.minWidth;
  this.height = this.minHeight;
  for (var e = 0; e < this.elements.length; e++) {
    var elem = this.elements[e];
    this.width += elem.width;
    if (!(elem.isSpacer())) {
      if (elem.type == 'hat') {
        this.startY = elem.startY;
        this.height = this.height + elem.height;
      }
      this.height = Math.max(this.height, elem.height);
    }
  }
  this.widthWithConnectedBlocks = this.width;
};

/**
 * An object containing information about what elements are in the bottom row of
 * a block as well as spacing information for the top row.
 * Elements in a bottom row can consist of corners, spacers and next connections.
 * @param {!Blockly.BlockSvg} block The block for which this represents the
 *     bottom row.
 * @package
 * @constructor
 * @extends {Blockly.blockRendering.Row}
 */
Blockly.blockRendering.BottomRow = function() {
  Blockly.blockRendering.BottomRow.superClass_.constructor.call(this);
  this.type = 'bottom row';

  /**
   * Whether this row has a next connection.
   * @package
   * @type {boolean}
   */
  this.hasNextConnection = false;

  /**
   * The next connection on the row, if any.
   * @package
   * @type {Blockly.blockRendering.NextConnection}
   */
  this.connection = null;

  /**
   * The amount that the bottom of the block extends below the horizontal edge,
   * e.g. because of a next connection.  Must be non-negative (see #2820).
   * @package
   * @type {number}
   */
  this.overhangY = 0;

  /**
   * True if the width of this row does not depend on its contents.
   * @type {boolean}
   */
  this.hasFixedWidth = false;
};
goog.inherits(Blockly.blockRendering.BottomRow, Blockly.blockRendering.Row);

/**
 * Create all non-spacer elements that belong on the bottom row.
 * @param {!Blockly.BlockSvg} block The block whose bottom row this represents.
 * @package
 */
Blockly.blockRendering.BottomRow.prototype.populate = function(block) {
  this.hasNextConnection = !!block.nextConnection;

  var followsStatement =
      block.inputList.length &&
      block.inputList[block.inputList.length - 1].type == Blockly.NEXT_STATEMENT;
  this.hasFixedWidth = followsStatement && block.getInputsInline();

  // This is the minimum height for the row. If one of its elements has a greater
  // height it will be overwritten in the compute pass.
  if (followsStatement) {
    this.minHeight = Blockly.blockRendering.constants.LARGE_PADDING;
  } else {
    this.minHeight = this.notchShape.height;
  }

  var squareCorner = !!block.outputConnection || !!block.getNextBlock();

  if (squareCorner) {
    this.elements.push(new Blockly.blockRendering.SquareCorner());
  } else {
    this.elements.push(new Blockly.blockRendering.RoundCorner());
  }

  if (this.hasNextConnection) {
    this.connection = new Blockly.blockRendering.NextConnection(
        /** @type {Blockly.RenderedConnection} */ (block.nextConnection));
    this.elements.push(this.connection);
  }
};

/**
 * @override
 */
Blockly.blockRendering.BottomRow.prototype.measure = function() {
  this.width = this.minWidth;
  this.height = this.minHeight;
  for (var e = 0; e < this.elements.length; e++) {
    var elem = this.elements[e];
    this.width += elem.width;
    if (!(elem.isSpacer())) {
      if (elem.type == 'next connection') {
        this.height = this.height + elem.height;
        this.overhangY = elem.height;
      }
      this.height = Math.max(this.height, elem.height);
    }
  }
  this.widthWithConnectedBlocks = this.width;
};
/**
 * An object containing information about a spacer between two rows.
 * @param {number} height The height of the spacer.
 * @param {number} width The width of the spacer.
 * @package
 * @constructor
 * @extends {Blockly.blockRendering.Row}
 */
Blockly.blockRendering.SpacerRow = function(height, width) {
  this.type = 'between-row spacer';
  this.width = width;
  this.height = height;
  this.followsStatement = false;
  this.widthWithConnectedBlocks = 0;
  this.elements = [new Blockly.blockRendering.InRowSpacer(width)];
};
goog.inherits(Blockly.blockRendering.SpacerRow,
    Blockly.blockRendering.Row);

/**
 * @override
 */
Blockly.blockRendering.SpacerRow.prototype.measure = function() {
  // NOP.  Width and height were set at creation.
};

/**
 * An object containing information about a row that holds one or more inputs.
 * @package
 * @constructor
 * @extends {Blockly.blockRendering.Row}
 */
Blockly.blockRendering.InputRow = function() {
  Blockly.blockRendering.InputRow.superClass_.constructor.call(this);
  this.type = 'input row';
};
goog.inherits(Blockly.blockRendering.InputRow,
    Blockly.blockRendering.Row);

/**
 * Inspect all subcomponents and populate all size properties on the row.
 * @package
 */
Blockly.blockRendering.InputRow.prototype.measure = function() {
  this.width = this.minWidth;
  this.height = this.minHeight;
  var connectedBlockWidths = 0;
  for (var e = 0; e < this.elements.length; e++) {
    var elem = this.elements[e];
    this.width += elem.width;
    if (elem.isInput) {
      if (elem.type == 'statement input') {
        connectedBlockWidths += elem.connectedBlockWidth;
      } else if (elem.type == 'external value input' &&
          elem.connectedBlockWidth != 0) {
        connectedBlockWidths += (elem.connectedBlockWidth - elem.connectionWidth);
      }
    }
    if (!(elem.isSpacer())) {
      this.height = Math.max(this.height, elem.height);
    }
  }
  this.widthWithConnectedBlocks = this.width + connectedBlockWidths;
};