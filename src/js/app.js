App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Compete.json", function(compete) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Compete = TruffleContract(compete);
      // Connect provider to interact with contract
      App.contracts.Compete.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Compete.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function() {
    var competeInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Compete.deployed().then(function(instance) {
      competeInstance = instance;
      return competeInstance.competitorsCount();
    }).then(function(competitorsCount) {
      var competitorsResults = $("#competitorsResults");
      competitorsResults.empty();

      var competitorsSelect = $('#competitorsSelect');
      competitorsSelect.empty();

      for (var i = 1; i <= competitorsCount; i++) {
        competeInstance.competitors(i).then(function(competitor) {
          var id = competitor[0];
          var name = competitor[1];
          var voteCount = competitor[2];

          // Render candidate Result
          var competitorTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          competitorsResults.append(competitorTemplate);

          // Render candidate ballot option
          var competitorOption = "<option value='" + id + "' >" + name + "</ option>"
          competitorsSelect.append(competitorOption);
        });
      }
      return competeInstance.voters(App.account);
    }).then(function(hasVoted) {
      // Do not allow a user to vote
      if(hasVoted) {
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var competitorId = $('#competitorsSelect').val();
    App.contracts.Compete.deployed().then(function(instance) {
      return instance.vote(competitorId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
