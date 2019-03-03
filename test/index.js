'use strict';

var should = require('chai').should();
var rpgcore = require('../');

describe('Library', function() {
  it('should export primatives', function() {
    should.exist(rpgcore.crypto);
    should.exist(rpgcore.encoding);
    should.exist(rpgcore.util);
    should.exist(rpgcore.errors);
    should.exist(rpgcore.Address);
    should.exist(rpgcore.Block);
    should.exist(rpgcore.MerkleBlock);
    should.exist(rpgcore.BlockHeader);
    should.exist(rpgcore.HDPrivateKey);
    should.exist(rpgcore.HDPublicKey);
    should.exist(rpgcore.Networks);
    should.exist(rpgcore.Opcode);
    should.exist(rpgcore.PrivateKey);
    should.exist(rpgcore.PublicKey);
    should.exist(rpgcore.Script);
    should.exist(rpgcore.Transaction);
    should.exist(rpgcore.URI);
    should.exist(rpgcore.Unit);
  });
});
