App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    //web3 initliaze ediyoruz ama metamask benzeri bir program web3 eklememişse ekliyoruz
    if (typeof web3 !== 'undefined'){
      //metamask eklemişse onu kullanıyoruz
      App.web3Provider = web3.currentProvider;
    } else {
      //yoksa biz ekleyip devam ediyoruz. kendi lokal node'umuza bağlıyoruz
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    App.displayAccountInfo();

    return App.initContract();
  },

  displayAccountInfo: function(){
    web3.eth.getCoinbase(function(err, account){
      if(err === null) {
        App.account = account;
        $('#account').text(account);
        web3.eth.getBalance(account, function(err, balance){
          if(err === null){
            $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH");
          }
        })
      }
    });
  },

  initContract: function() {
    $.getJSON('SellList.json', function(sellListArtifact){
      //Truffle dan artifact'i aldık; sonra initialize ettiğimiz provider ı set ettik ve satış listemizi çekiyoruz
      App.contracts.SellList = TruffleContract(sellListArtifact);
      App.contracts.SellList.setProvider(App.web3Provider);
      //listen listenevents
      App.listenToEvents();
      return App.reloadArticles();
    });
  },

  reloadArticles: function(){
    //tekrar tekrar çağırılmasını engellemek için
    if (App.loading) {
      return;
    }
    App.loading = true;

    //balance değişmiş olabileceği için her initialize seferinde refresh ediyoruz
    App.displayAccountInfo();

    var sellListInstance;

    App.contracts.SellList.deployed().then(function(instance){
      sellListInstance = instance;
      //listeyi alıp chain olarak bağlıyoruz
      return sellListInstance.getArticlesForSale();
    }).then(function(articleIds){
      //var olan satış kayıtlarını listeden temizliyoruz
      $('#articlesRow').empty();

      for (var i = 0; i < articleIds.length; i++) {
        var articleId = articleIds[i];
        sellListInstance.articles(articleId.toNumber()).then(function(article){
          App.displayArticle(article[0], article[1], article[3], article[4], article[5]);
        })
      }
      App.loading = false;

    }).catch(function(err) {
      console.error(err.message);
      App.loading = false;
    });
  },

  displayArticle: function(id, seller, name, description, price) {
    var articlesRow = $('#articlesRow');

    var etherPrice = web3.fromWei(price, "ether");

    var articleTemplate = $("#articleTemplate");
    articleTemplate.find('.panel-title').text(name);
    articleTemplate.find('.article-description').text(description);
    articleTemplate.find('.article-price').text(etherPrice + " ETH");
    articleTemplate.find('.btn-buy').attr('data-id', id);
    articleTemplate.find('.btn-buy').attr('data-value', etherPrice);

    // seller
    if (seller == App.account) {
      articleTemplate.find('.article-seller').text("Sizin Satışınız!");
      articleTemplate.find('.btn-buy').hide();
    } else {
      articleTemplate.find('.article-seller').text(seller);
      articleTemplate.find('.btn-buy').show();
    }

    // add this new article
    articlesRow.append(articleTemplate.html());
  },

  sellArticle: function(){
    //satış bilgilerini jquery ile al
    var _article_name = $('#article_name').val();
    var _description = $('#article_description').val();
    var _price = web3.toWei(parseFloat($('#article_price').val() || 0), "ether");

    if((_article_name.trim() == '') || (_price == 0)) {
      // satacak birşey yok
      return false;
    }

    //satış işlemi için verilmesi gereken bedeli belirleyebiliriz
    App.contracts.SellList.deployed().then(function(instance){
      return instance.sellArticle(_article_name, _description, _price, {
        from: App.account,
        gas: 500000
      });
    }).then(function(result){
      //arayüzü yeniliyoruz
      App.reloadArticles();

    }).catch(function(err){
      console.error(err);
    })
  },

  //kontrat tarafından tetiklenen olayları alabilmek için
  listenToEvents: function() {
     App.contracts.SellList.deployed().then(function(instance) {
       instance.LogSellArticle({}, {}).watch(function(error, event) {
         if (!error) {
           $("#events").append('<li class="list-group-item">' + event.args._name + ' is now for sale</li>');
         } else {
           console.error(error);
         }
         App.reloadArticles();
       });

       instance.LogBuyArticle({}, {}).watch(function(error, event) {
         if (!error) {
           $("#events").append('<li class="list-group-item">' + event.args._buyer + ' bought ' + event.args._name + '</li>');
         } else {
           console.error(error);
         }
         App.reloadArticles();
       });
     });
   },

   buyArticle: function() {
     event.preventDefault();

     // retrieve the article price and id
     var _articleId = parseFloat($(event.target).data('id'));
     var _price = parseFloat($(event.target).data('value'));

     App.contracts.SellList.deployed().then(function(instance){
       return instance.buyArticle(_articleId, {
         from: App.account,
         value: web3.toWei(_price, "ether"),
         gas: 500000
       });
     }).catch(function(error) {
       console.error(error);
     });
   }
 };


$(function() {
  $(window).load(function() {
    App.init();
  });
});
