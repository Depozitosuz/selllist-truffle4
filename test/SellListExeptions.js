// contract to be tested
var SellList = artifacts.require("./SellList.sol");

// test suite
contract("SellList", function(accounts){
  var SellListInstance;
  var seller = accounts[1];
  var buyer = accounts[2];
  var articleName = "article 1";
  var articleDescription = "Description for article 1";
  var articlePrice = 10;

  // no article for sale yet
  it("should throw an exception if you try to buy an article when there is no article for sale yet", function() {
    return SellList.deployed().then(function(instance) {
      SellListInstance = instance;
      return SellListInstance.buyArticle(1, {
        from: buyer,
        value: web3.toWei(articlePrice, "ether")
      });
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return SellListInstance.getNumberOfArticles();
    }).then(function(data) {
      assert.equal(data.toNumber(), 0, "number of articles must be 0");
    });
  });

  // buy an article that does not exist
  it("should throw an exception if you try to buy an article that does not exist", function(){
    return SellList.deployed().then(function(instance){
      SellListInstance = instance;
      return SellListInstance.sellArticle(articleName, articleDescription, web3.toWei(articlePrice, "ether"), { from: seller });
    }).then(function(receipt){
      return SellListInstance.buyArticle(2, {from: seller, value: web3.toWei(articlePrice, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      assert(true);
    }).then(function() {
      return SellListInstance.articles(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "article id must be 1");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], 0x0, "buyer must be empty");
      assert.equal(data[3], articleName, "article name must be " + articleName);
      assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
      assert.equal(data[5].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice, "ether"));
    });
  });

  // buying an article you are selling
  it("should throw an exception if you try to buy your own article", function() {
    return SellList.deployed().then(function(instance){
      SellListInstance = instance;

      return SellListInstance.buyArticle(1, {from: seller, value: web3.toWei(articlePrice, "ether")});
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return SellListInstance.articles(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "article id must be 1");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], 0x0, "buyer must be empty");
      assert.equal(data[3], articleName, "article name must be " + articleName);
      assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
      assert.equal(data[5].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice, "ether"));
    });
  });

  // incorrect value
  it("should throw an exception if you try to buy an article for a value different from its price", function() {
    return SellList.deployed().then(function(instance){
      SellListInstance = instance;
      return SellListInstance.buyArticle(1, {from: buyer, value: web3.toWei(articlePrice + 1, "ether")});
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return SellListInstance.articles(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "article id must be 1");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], 0x0, "buyer must be empty");
      assert.equal(data[3], articleName, "article name must be " + articleName);
      assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
      assert.equal(data[5].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice, "ether"));
    });
  });

  // article has already been sold
  it("should throw an exception if you try to buy an article that has already been sold", function() {
    return SellList.deployed().then(function(instance){
      SellListInstance = instance;
      return SellListInstance.buyArticle(1, {from: buyer, value: web3.toWei(articlePrice, "ether")});
    }).then(function(){
      return SellListInstance.buyArticle(1, {from: web3.eth.accounts[0], value: web3.toWei(articlePrice, "ether")});
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return SellListInstance.articles(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "article id must be 1");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], buyer, "buyer must be " + buyer);
      assert.equal(data[3], articleName, "article name must be " + articleName);
      assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
      assert.equal(data[5].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice, "ether"));
    });
  });
});
