pragma solidity ^0.5.8;

contract Compete {
    // Model 
    struct Competitor {
        uint id;
        string name;
        uint voteCount;
    }

    // Pohrana računa koji su glasali
    mapping(address => bool) public voters;
    // Dohvaćanje kompetitora
    mapping(uint => Competitor) public competitors;
    // Pohrana broja glasova
    uint public competitorsCount;

    // kreiranje voted event
    event votedEvent (
        uint indexed _competitorId
    );
    //konstruktor za kandidate u natjecanju
    constructor () public {
        addCompetitor("Android");
        addCompetitor("Apple");
    }

    function addCompetitor (string memory _name) private {
        competitorsCount ++;
        competitors[competitorsCount] = Competitor(competitorsCount, _name, 0);
    }

    function vote (uint _competitorId) public {
        // zahtjeva da računi nisu već prethodno glasali
        require(!voters[msg.sender]);

        // provjera validnosti 
        require(_competitorId > 0 && _competitorId <= competitorsCount);

        // zapis o danom glasu
        voters[msg.sender] = true;

        // ažurira broj glasova
        competitors[_competitorId].voteCount ++;

        // trigger na voted event
        emit votedEvent(_competitorId);
    }
}
