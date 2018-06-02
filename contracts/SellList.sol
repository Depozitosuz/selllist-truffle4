pragma solidity ^0.4.18;

import "./Ownable.sol";

//sahip olma konusunu ayrı sol dosyasına aldık ve is Ownable diyerek kullandık
contract SellList is Ownable {

  struct Article {
    uint id;
    //address değişkenlerinin boş hali 0x0 şeklinde
    address seller;
    address buyer;
    string name;
    string description;
    uint256 price;
  }

  //address owner;
  //durum değişkenleri (array benzeri id üzerinden ulaşılabilir değişken dahil)
  mapping (uint => Article) public articles;
  uint articleCounter;

  //blockchaine her deploy edildiğinde bir kez çalışacak
  //constructer
  /*
  function SellList() public {
    sellArticle("Varsayılan Satış", "Varsayılan olarak yapılan satış", 10000000000000000000);
  }
  */

  event LogSellArticle(
    uint indexed _id,
    address indexed _seller,
    string _name,
    uint256 _price
  );

  event LogBuyArticle(
    uint indexed _id,
    address indexed _seller,
    address indexed _buyer,
    string _name,
    uint256 _price
  );

  //constructor yazıyoruz; kill/destroy edebilmemiz için kontratı (Ownable oldu)
  /*
  function SellList() public {
    owner = msg.sender;
  }
  */

  // _ place holder olarak şart. modifier'ı herhangi bir fonksiyona uygulamak mümkün. bu ornekte kill (Ownable oldu)
  /*
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }
  */

  //kontratı deaktive etmek için/kaldırmak için
  function kill() public onlyOwner {
    selfdestruct(owner);
  }

  function sellArticle(string _name, string _description, uint256 _price) public {
    // a new article
    articleCounter++;

    // store this article
    articles[articleCounter] = Article(
      articleCounter,
      msg.sender,
      0x0,
      _name,
      _description,
      _price
    );

    LogSellArticle(articleCounter, msg.sender, _name, _price);
  }

  // fetch the number of articles in the contract
  function getNumberOfArticles() public view returns (uint) {
    return articleCounter;
  }

  /*
  //birden çok satş çekerken gereksiz
  function getArticle() public view returns (
    address _seller,
    address _buyer,
    string _name,
    string _description,
    uint256 _price
    ) {
      return (seller, buyer, name, description, price);
  }
  */

  // fetch and return all article IDs for articles still for sale
 function getArticlesForSale() public view returns (uint[]) {
   // prepare output array
   uint[] memory articleIds = new uint[](articleCounter);

   uint numberOfArticlesForSale = 0;
   // iterate over articles
   for(uint i = 1; i <= articleCounter;  i++) {
     // keep the ID if the article is still for sale
     if(articles[i].buyer == 0x0) {
       articleIds[numberOfArticlesForSale] = articles[i].id;
       numberOfArticlesForSale++;
     }
   }

   // copy the articleIds array into a smaller forSale array
   uint[] memory forSale = new uint[](numberOfArticlesForSale);
   for(uint j = 0; j < numberOfArticlesForSale; j++) {
     forSale[j] = articleIds[j];
   }
   return forSale;
 }


  function buyArticle(uint _id) payable public {
    //satıştakileri kontrol et
    require(articleCounter > 0);

    //satışların var olan araklıkta olup olmadığını kontrol et
    require(_id > 0 && _id <= articleCounter);

    //ilgili satışı çekiyoruz (mapping'den)
    Article storage article = articles[_id];

    //henüz satılmadıklarından emin ol
    require(article.buyer == 0x0);

    //kendi satışını satın alamasın
    require(msg.sender != article.seller);

    //gönderilen bedelin tam olarak eşit olduğunu kontrol et
    require(msg.value == article.price);

    //alıcının bilgilerini keydet
    article.buyer = msg.sender;

    //satıcıya bedel transfer edilir
    article.seller.transfer(msg.value);

    //event i tetikliyoruz
    LogBuyArticle(_id, article.seller, article.buyer, article.name, article.price);

  }

}
