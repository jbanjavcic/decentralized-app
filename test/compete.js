var Compete = artifacts.require("./Compete.sol");

contract("Competition", function(accounts) {
  var competeInstance;

  it("initializes with two candidates", function() {
    return Compete.deployed().then(function(instance) {
      return instance.competitorsCount();
    }).then(function(count) {
      assert.equal(count, 2);
    });
  });

  it("it initializes the candidates with the correct values", function() {
    return Compete.deployed().then(function(instance) {
      competeInstance = instance;
      return competeInstance.competitors(1);
    }).then(function(competitor) {
      assert.equal(competitor[0], 1, "contains the correct id");
      assert.equal(competitor[1], "Android", "contains the correct name");
      assert.equal(competitor[2], 0, "contains the correct votes count");
      return competeInstance.competitors(2);
    }).then(function(competitor) {
      assert.equal(competitor[0], 2, "contains the correct id");
      assert.equal(competitor[1], "Apple", "contains the correct name");
      assert.equal(competitor[2], 0, "contains the correct votes count");
    });
  });

  it("allows a voter to cast a vote", function() {
    return Compete.deployed().then(function(instance) {
      competeInstance = instance;
      competitorId = 1;
      return competeInstance.vote(competitorId, { from: accounts[0] });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an event was triggered");
      assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
      assert.equal(receipt.logs[0].args._competitorId.toNumber(), competitorId, "the competitor id is correct");
      return competeInstance.voters(accounts[0]);
    }).then(function(voted) {
      assert(voted, "the voter was marked as voted");
      return competeInstance.competitors(competitorId);
    }).then(function(competitor) {
      var voteCount = competitor[2];
      assert.equal(voteCount, 1, "increments the competitor's vote count");
    })
  });

  it("throws an exception for invalid competitors", function() {
    return Compete.deployed().then(function(instance) {
      competeInstance = instance;
      return competeInstance.vote(99, { from: accounts[1] })
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return competeInstance.competitors(1);
    }).then(function(competitor1) {
      var voteCount = competitor1[2];
      assert.equal(voteCount, 1, "Android did not receive any votes");
      return competeInstance.competitors(2);
    }).then(function(competitor2) {
      var voteCount = competitor2[2];
      assert.equal(voteCount, 0, "Apple did not receive any votes");
    });
  });

  it("throws an exception for double voting", function() {
    return Compete.deployed().then(function(instance) {
      competeInstance = instance;
      competitorId = 2;
      competeInstance.vote(competitorId, { from: accounts[1] });
      return competeInstance.competitors(competitorId);
    }).then(function(competitor) {
      var voteCount = competitor[2];
      assert.equal(voteCount, 1, "accepts first vote");
      // Try to vote again
      return competeInstance.vote(competitorId, { from: accounts[1] });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return competeInstance.competitors(1);
    }).then(function(competitor1) {
      var voteCount = competitor1[2];
      assert.equal(voteCount, 1, "Android did not receive any votes");
      return competeInstance.competitors(2);
    }).then(function(competitor2) {
      var voteCount = competitor2[2];
      assert.equal(voteCount, 1, "Apple did not receive any votes");
    });
  });
});
