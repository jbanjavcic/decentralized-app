App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Compete.json", function(compete) {
      App.contracts.Compete = TruffleContract(compete);
      App.contracts.Compete.setProvider(App.web3Provider);
      App.listenForEvents();
      return App.render();
    });
  },

  listenForEvents: function() {
    App.contracts.Compete.deployed().then(function(instance) {
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
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

    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

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

          var competitorTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          competitorsResults.append(competitorTemplate);

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
