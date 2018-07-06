
// {{!-- Scripts start here --}}

// <script type="text/javascript">

    //SearchBarArea Begin
    var $hudnavCollapse = $('#hud-navCollapse'); //collapsible
        var $searchForm = $('#searchForm');
            var $selectRetailer = $('#selectRetailer');
            var $selectDept = $('#selectDept');
            var $searchWords = $('#searchWords');
            var $cartMainButton = $('#cartMainButton');
    //SearchBarArea End    
    var $fbButton = $('#fbButton');
    var $fbLogout = $('#fbLogout');


    //Container Begin
    var $mainPane = $('mainPane');
        var $bannersArea = $('#bannersArea');
        var $storeArea = $('#storeArea');
            var $tabSelector = $('#tabSelector');
            var $searchResultsArea = $('#searchResultsArea');
                var $filterArea = $('#filterArea');
                    var $filters = $('#filters'); //collapsible
                        var $browseNodeList = $('#browseNodeList');
                var $productArea = $('#productArea');
                    var $searchResults = $('#searchResults');
            var $itemDetails = $('#itemDetails');
                var $backToResultsForm = $('#backToResultsForm');
                    var $backToResultsButton = $('#backToResultsButton');
                    var $itemAltImgsDiv = $('#itemAltImgsDiv');
                        var $itemAltImgsUL = $('#itemAltImgsUL');
                    var $itemMainImgContainer = $('#itemMainImgContainer');
                            var $itemMainImgDiv = $('#itemMainImgDiv');
                    var $itemCenterTitle = $('#itemCenterTitle');
                    var $aboveTitleHR = $('#aboveTitleHR');
                        var $listPrice = $('#listPrice');
                            var $listPriceDiv = $('#listPriceDiv');
                        var $offerPrice = $('#offerPrice');
                            var $offerPriceDiv = $('#offerPriceDiv');
                        var $amountSaved = $('#amountSaved');
                            var $amountSavedDiv = $('#amountSavedDiv');
                        var $amznfulfilled = $('#amznfulfilled');
                    var $itemMerchantDiv = $('#itemMerchantDiv');
                    var $itemFeatureUL = $('#itemFeatureUL');
                    var $itemRight = $('#itemRight');
                            var $quantityDropDown = $('#quantityDropDown');
                            var $addToCartButton = $('#addToCartButton');
                            var $itemUnavailableTextDiv = $('#itemUnavailableTextDiv');
                            var $addToCartAvailabilityTextDiv = $('#addToCartAvailabilityTextDiv');
                            var $addToCartPrimeDiv = $('#addToCartPrimeDiv');
                            var $addToCartSuperSaverDiv = $('#addToCartSuperSaverDiv');
                var $itemBottomDiv = $('#itemBottomDiv');
                    var $custReviewIframe = $('#custReviewIframe');
            var $shoppingCartArea = $('#shoppingCartArea');
                        var $cartItemOuterContainer = $('#cartItemOuterContainer');
                        var $checkoutMainDiv = $('#checkoutMainDiv');
    var $chatPane = $('#chatPane');
    //Container End
    
    //Set Initial State
    var socket = io('/');
    //End Initial State

    if (sessionStorage){
        if (sessionStorage.getItem('currentRetailer')){
            var currentRetailer = sessionStorage.getItem('currentRetailer');

            $selectRetailer.val(currentRetailer);

            if (sessionStorage.getItem(currentRetailer+'-CartId')){
                if (sessionStorage.getItem(currentRetailer+'-cartItemCount')){
                    var itemCount = parseInt(sessionStorage.getItem(currentRetailer+'-cartItemCount'));
                    
                    if (itemCount != 0){
                        if (itemCount == 1){
                            var itemCountString = '1 Item';
                        }
                        else
                        {
                            var itemCountString = itemCount.toString()+' Items';
                        }

                        $cartMainButton.empty();
                        $cartMainButton.append('<img id="cartImage" src="/cartWhite2000.png" /> '+itemCountString);
                        
                        $cartMainButton.show();
                    }
                }
            }
        }
    }

    $searchForm.submit(function(e){
        e.preventDefault();
        execSearch('','',{lookupBrowseNode: true});
    });

    $backToResultsForm.submit(function(e){
        e.preventDefault();
        console.log('backToResultsForm clicked');
        viewController('searchResults');
    });


    function execSearch(node, dept, others){

        if (sessionStorage){
            sessionStorage.setItem('currentRetailer', $selectRetailer.val());
        }

        $(".overlay").show();
        $hudnavCollapse.collapse('hide');
        $filters.collapse('hide');

        var browseNodeId;
        if (node){
            browseNodeId = node;
        }

        var department;
        if (dept){
            $selectDept.val(dept);
            department = dept;
        }
        else {
            department = $selectDept.val();
        }

        var page = 1;
        if (others && others.pagenum){
            page = others.pagenum;
        }

        var lookupBrowseNode = false;
        if (others && others.lookupBrowseNode){
            lookupBrowseNode = others.lookupBrowseNode;
        }

        console.log('department: '+department);

        socket.emit('searchParams', {dept: department, keyw: $searchWords.val(), retailer: $selectRetailer.val(), nodeId: browseNodeId, pagenum: page, lookupBrowseNode: lookupBrowseNode});
    }

    //Receive Search Results
    socket.on('searchResult', function(data){
        if (data.failed){
            console.log('search failed, retrying');
            if (data.failed.nodeId && data.failed.dept && $searchWords.val()){
                $searchWords.val('');

                execSearch(data.failed.nodeId, data.failed.dept);
            }
            else if (!data.failed.nodeId && data.failed.dept != 'All'){
                $selectDept.val('All');
                execSearch(data.failed.nodeId, 'All');       
            } 
            else {
                alert('Invalid Search');
                $(".overlay").hide();                
            }
        }
        else {
            console.log(data);
            // console.log(data.ItemSearchResponse);
            // console.log(data.ItemSearchResponse.Items.Item[0]);

            $selectDept.val(data.returnDept);

            $searchResults.empty();
            for(i=0; i<data.ItemSearchResponse.Items.Item.length; i++)
            {
                //BEGIN SEARCH RESULTS//
                var item = data.ItemSearchResponse.Items.Item[i];
                var price = 'N/A';
                var itemURL = '';
                var imageURL = '';
                var title = '';
                var brand = '';
                var price = 'N/A';
                var isEligibleForPrime = false;
                var primeImageHtml = '<img height="14px">';

                // Begin Price
                if (item.Variations && item.Variations.Item && item.Variations.Item.constructor === Array && item.Variations.Item[0]
                        && item.Variations.Item[0].Offers && item.Variations.Item[0].Offers.Offer && item.Variations.Item[0].Offers.Offer.OfferListing
                        && item.Variations.Item[0].Offers.Offer.OfferListing.Price && item.Variations.Item[0].Offers.Offer.OfferListing.Price.FormattedPrice)
                {
                    price = item.Variations.Item[0].Offers.Offer.OfferListing.Price.FormattedPrice;
                    if (item.Variations.Item[0].Offers.Offer.OfferListing.IsEligibleForPrime == 1){
                        isEligibleForPrime = true;
                    }
                }
                else if (item.Offers && item.Offers.Offer && item.Offers.Offer.OfferListing 
                    && item.Offers.Offer.OfferListing.Price && item.Offers.Offer.OfferListing.Price.FormattedPrice)
                {
                    price = item.Offers.Offer.OfferListing.Price.FormattedPrice;
                    if(item.Offers.Offer.OfferListing.IsEligibleForPrime == 1){
                        isEligibleForPrime = true;
                    }
                }
                // End Price

                if (isEligibleForPrime){
                    primeImageHtml = '<img src="/prime-check-badge-14._CB138348888_.png">';
                }

                //Begin Detail URL
                if (item.DetailPageURL){
                    itemURL = item.DetailPageURL;
                }
                //End Detail URL

                //Begin Image
                if (item.ImageSets && item.ImageSets.ImageSet){
                    if (item.ImageSets.ImageSet.constructor === Array && item.ImageSets.ImageSet[0] && item.ImageSets.ImageSet[0].MediumImage && item.ImageSets.ImageSet[0].MediumImage.URL){
                        imageURL = item.ImageSets.ImageSet[0].MediumImage.URL;
                        console.log('imageset array:'+imageURL);
                    } 
                    else if (item.ImageSets.ImageSet.MediumImage && item.ImageSets.ImageSet.MediumImage.URL){
                        imageURL = item.ImageSets.ImageSet.MediumImage.URL;
                        console.log('imageset direct:'+imageURL);
                    }    
                }
                else if (item.Variations && item.Variations.Item && item.Variations.Item.constructor === Array) {
                    for (t=0; t < item.Variations.Item.length; t++){
                        if (item.Variations.Item[t].MediumImage){
                            imageURL = item.Variations.Item[t].MediumImage.URL;
                            console.log('variation image: '+imageURL);
                            break;
                        }
                    }
                }

                //End Image

                //Begin Title
                if (item.ItemAttributes){
                    if (item.ItemAttributes.Title){
                        title = item.ItemAttributes.Title;
                    }
                    if (item.ItemAttributes.Brand){
                        brand = 'By '+ item.ItemAttributes.Brand;
                    }
                }
                //End Title

                var ASIN = "";
                ASIN = item.ASIN;

                //<a href='+ itemURL +' target="_blank">
                var divText =   '<div id="'+ASIN.toString()+'" onclick="itemLookup(this.id)" class="product-box">'+
                                    '<div class="product-image-div middle">'+
                                        '<img class="product-image" src="'+ imageURL +'">'+
                                    '</div>'+
                                    '<div class="product-title">'+ title +'<br><p>'+ brand +'</p></div>'+
                                    '<div class="product-prime-box">'+primeImageHtml+'</div>' +
                                    '<p class="product-price">'+price+'</p>'+
                                '</div>';

                $searchResults.append(divText);
                //END SEARCH RESULTS//

                
                // var userName1 = $username.val();
                // var initiator1 = $initiator.text();

                // if (userName1 == initiator1)
                // {
                //     io.connect('/').emit('store history', divText);
                // }
            }

            if (data.BrowseNode){
                //BEGIN BrowseNode tree//            
                var ancestors = [];
                var children = [];
                var browseNodeDivText = '';
                var disabledText = '';

                if (data.disableTree){
                    disabledText = ' disabled';
                }

                if (data.BrowseNode && data.BrowseNode.BrowseNodes.BrowseNode.Ancestors){
                    var ancestorCursor = data.BrowseNode.BrowseNodes.BrowseNode;
                    var len=0;
                    while (ancestorCursor.Ancestors){
                        if (ancestorCursor.Ancestors.BrowseNode.Name != 'Categories'){
                            ancestors.push({
                                BrowseNodeId: ancestorCursor.Ancestors.BrowseNode.BrowseNodeId,
                                Name: ancestorCursor.Ancestors.BrowseNode.Name  
                            });
                            len++;
                        }

                        ancestorCursor =  ancestorCursor.Ancestors.BrowseNode;
                    }

                    ancestors.reverse();

                    if (data.BrowseNode.BrowseNodes.BrowseNode.Name != 'Categories'){
                        ancestors.push({
                            BrowseNodeId: data.BrowseNode.BrowseNodes.BrowseNode.BrowseNodeId,
                            Name: data.BrowseNode.BrowseNodes.BrowseNode.Name  
                        });
                        len++;
                    }

                    for (i=0; i < len-1; i++){
                        browseNodeDivText+= '<li class="ancestorNode"><a class="btn'+disabledText+'" onclick="execSearch(&quot;'+ancestors[i].BrowseNodeId+'&quot;,&quot;'+$selectDept.val()+'&quot;,{lookupBrowseNode: true})">'+ancestors[i].Name+'</a></li>';
                    }

                    browseNodeDivText+= '<li class="ancestorNodeCurrent"><a class="btn disabled">'+ancestors[len-1].Name+'</a></li>';
                }
                else {
                    browseNodeDivText+= '<li class="ancestorNodeCurrent"><a class="btn disabled">'+data.BrowseNode.BrowseNodes.BrowseNode.Name+'</a></li>';    
                }

                if (data.BrowseNode && data.BrowseNode.BrowseNodes.BrowseNode.Children){
                    var children = data.BrowseNode.BrowseNodes.BrowseNode.Children.BrowseNode;
                    browseNodeDivText+= '<ul class="childList">';
                    if (children.constructor === Array){
                        for (i=0; i<children.length; i++){
                            browseNodeDivText+= '<li class="childNode"><a class="btn'+disabledText+'" onclick="execSearch(&quot;'+children[i].BrowseNodeId+'&quot;,&quot;'+$selectDept.val()+'&quot;,{lookupBrowseNode: true})">'+children[i].Name+'</a></li>';
                        }
                    }
                    else{
                        browseNodeDivText+= '<li class="childNode"><a class="btn'+disabledText+'" onclick="execSearch(&quot;'+children.BrowseNodeId+'&quot;,&quot;'+$selectDept.val()+'&quot;,{lookupBrowseNode: true})">'+children.Name+'</a></li>';
                    }

                    browseNodeDivText+= '</ul>';
                }

                if (browseNodeDivText != ''){
                    $browseNodeList.empty();
                    $browseNodeList.append(browseNodeDivText);
                }
                //END BrowseNode tree//
            }
            $(".overlay").hide();
            viewController('searchResults');
        }
    });
    //END RECEIVE SEARCH RESULTS//

    //ITEM LOOKUP
    function itemLookup(itemAsin){
        $(".overlay").show();

        if (sessionStorage){
            if (sessionStorage.getItem('currentOfferListingId')){
                sessionStorage.removeItem('currentOfferListingId');
            }
            if (!sessionStorage.getItem('currentRetailer')){
                sessionStorage.setItem('currentRetailer', $selectRetailer.val());
            }
        }

        socket.emit('itemLookup', {itemAsin: itemAsin, retailer: $selectRetailer.val()});
    }
    //END ITEM LOOKUP
    function setmainpic(item){
        $(".itemMainImg").attr("src",item.src);
    }

    //Receive Item Lookup Results
    socket.on('itemLookupResult', function(data){
        console.log(data);
        var item;
        var parentItem;

        if (data.ItemLookupResponse && data.ItemLookupResponse.Items && data.ItemLookupResponse.Items.Item){

            parentItem = data.ItemLookupResponse.Items.Item;

            if(data.ItemLookupResponse.Items.Item.Variations && data.ItemLookupResponse.Items.Item.Variations.Item 
                    && data.ItemLookupResponse.Items.Item.Variations.Item.constructor === Array){

                for (i=0; i< data.ItemLookupResponse.Items.Item.Variations.Item.length; i++){
                    if (data.ItemLookupResponse.Items.Item.Variations.Item[i].ImageSets && !item){
                        item = data.ItemLookupResponse.Items.Item.Variations.Item[i];
                        break;
                    }
                }
            }
            else {
                item = data.ItemLookupResponse.Items.Item;
            }
        }

        if (item){

            var altImgsDivText='';
            var mainImgDivText='';
            var titleDivText;
            var merchantDivText;
            var listPriceDivText;
            var offerPriceDivText;
            var amountSavedDivText;
            var featuresDivText = '';
            var isFulfilled = false;
            var percentSaved = '';
            var firstToReviewText = '<a>Be the first to review this item</a>';

            if (sessionStorage){
                if (sessionStorage.getItem('currentASIN')){
                    sessionStorage.removeItem('currentASIN');
                }
                if (sessionStorage.getItem('currentOfferListingId')){
                    sessionStorage.removeItem('currentOfferListingId');
                }
                if (sessionStorage.getItem('currentItemImgURL')){
                    sessionStorage.removeItem('currentItemImgURL');
                }
                if (sessionStorage.getItem('currentItemMaxQty')){
                    sessionStorage.removeItem('currentItemMaxQty');
                }

                sessionStorage.setItem('currentASIN', item.ASIN);
            }

            if (parentItem.CustomerReviews){
                if (parentItem.CustomerReviews.HasReviews && parentItem.CustomerReviews.HasReviews == 'false'){
                    $aboveTitleHR.empty();
                    $aboveTitleHR.append(firstToReviewText);

                    $custReviewIframe.hide();
                }
                else if (parentItem.CustomerReviews.HasReviews && parentItem.CustomerReviews.HasReviews == 'true'){
                    $aboveTitleHR.empty();
                    if (parentItem.CustomerReviews.IFrameURL){
                        $custReviewIframe.show();
                        $custReviewIframe.attr("src", parentItem.CustomerReviews.IFrameURL);
                        $custReviewIframe.attr("height", '600px');
                    }
                }
            }

            if (item.ItemAttributes){
                if (item.ItemAttributes.Title){
                    $itemCenterTitle.empty();
                    titleDivText = item.ItemAttributes.Title;
                    $itemCenterTitle.append(titleDivText);
                }

                if (item.ItemAttributes.ListPrice && item.ItemAttributes.ListPrice.FormattedPrice){
                    listPriceDivText = item.ItemAttributes.ListPrice.FormattedPrice;
                }

                if (item.ItemAttributes && item.ItemAttributes.Feature && item.ItemAttributes.Feature.constructor === Array){
                    
                    for (i=0; i<item.ItemAttributes.Feature.length; i++){
                        featuresDivText+= '<li>'+item.ItemAttributes.Feature[i]+'</li>';
                    }
                    
                    $itemFeatureUL.empty();
                    $itemFeatureUL.append(featuresDivText);
                }
            }

            if (item.OfferSummary && item.OfferSummary.TotalNew && item.OfferSummary.TotalNew != '0') {
                //<option value="1">1</option>
                var quantityDropDownText = '';

                var totalNew = parseInt(item.OfferSummary.TotalNew);

                if (sessionStorage){
                    sessionStorage.setItem('currentItemMaxQty', totalNew);
                }

                for (i = 1; i<= totalNew; i++){
                    quantityDropDownText += '<option value="'+i+'">'+i+'</option>';
                }

                $quantityDropDown.empty();
                $quantityDropDown.append(quantityDropDownText);
            } 
            else
            {
                if (sessionStorage){
                    sessionStorage.setItem('currentItemMaxQty', 1);
                }

                $quantityDropDown.empty();
                $quantityDropDown.append('<option value="1">1</option>')
            }

            if (item.Offers && item.Offers.Offer) {

                $itemUnavailableTextDiv.hide();

                if (item.Offers.Offer.OfferListing){

                    if (item.Offers.Offer.OfferListing.OfferListingId){
                        sessionStorage.setItem('currentOfferListingId', item.Offers.Offer.OfferListing.OfferListingId);
                    }                    

                    if (item.Offers.Offer.OfferListing.IsEligibleForSuperSaverShipping && item.Offers.Offer.OfferListing.IsEligibleForSuperSaverShipping == '1'){
                        isFulfilled = true;
                        $amznfulfilled.show();
                        $addToCartSuperSaverDiv.show();
                    }
                    else{
                        $amznfulfilled.hide();
                        $addToCartSuperSaverDiv.hide();
                    }

                    if (item.Offers.Offer.OfferListing.IsEligibleForPrime && item.Offers.Offer.OfferListing.IsEligibleForPrime == '1'){
                        $addToCartPrimeDiv.show();
                    }
                    else{
                        $addToCartPrimeDiv.hide();
                    }

                    $addToCartAvailabilityTextDiv.empty();    
                    if (item.Offers.Offer.OfferListing.Availability){
                        $addToCartAvailabilityTextDiv.append('<b>Availability: </b>'+item.Offers.Offer.OfferListing.Availability);
                    }

                    if (item.Offers.Offer.OfferListing.PercentageSaved){
                        percentSaved = item.Offers.Offer.OfferListing.PercentageSaved;
                    }

                    if (item.Offers.Offer.OfferListing.Price && item.Offers.Offer.OfferListing.Price.FormattedPrice){
                        offerPriceDivText = item.Offers.Offer.OfferListing.Price.FormattedPrice;
                    }

                    if (item.Offers.Offer.OfferListing.SalePrice && item.Offers.Offer.OfferListing.SalePrice.FormattedPrice){
                        offerPriceDivText = item.Offers.Offer.OfferListing.SalePrice.FormattedPrice;
                    }

                    if (item.Offers.Offer.OfferListing.AmountSaved && item.Offers.Offer.OfferListing.AmountSaved.FormattedPrice){
                        amountSavedDivText = item.Offers.Offer.OfferListing.AmountSaved.FormattedPrice;
                    }
                }
                else 
                {
                    $itemUnavailableTextDiv.show();
                    $addToCartButton.attr('disabled','disabled');
                    offerPriceDivText = 'N/A';
                }

                if(item.Offers.Offer.Merchant && item.Offers.Offer.Merchant.Name){
                    merchantDivText = 'Sold By <a>'+item.Offers.Offer.Merchant.Name+'</a>';
                    if (isFulfilled){
                        merchantDivText+=' and <a target="_blank" href="https://www.amazon.in/gp/help/customer/display.html?ie=UTF8&ref=dp_fulfillment&nodeId=200953360">Fulfilled by Amazon</a>.';
                    }

                    $itemMerchantDiv.append(merchantDivText);
                }
            }
            else
            {
                $itemUnavailableTextDiv.show();
                $addToCartButton.attr('disabled','disabled');
                offerPriceDivText = 'N/A';
            }

            if (percentSaved && percentSaved != ''){
                $listPrice.show();
                $listPriceDiv.empty();
                $listPriceDiv.append(listPriceDivText);

                $offerPrice.show();
                $offerPriceDiv.empty();
                $offerPriceDiv.append(offerPriceDivText);

                $amountSaved.show();
                $amountSavedDiv.empty();
                $amountSavedDiv.append(amountSavedDivText+' ('+percentSaved+'%)');
            }
            else
            {
                $listPrice.hide();
                $amountSaved.hide();

                $offerPrice.show();
                $offerPriceDiv.empty();
                $offerPriceDiv.append(offerPriceDivText);
            }

            if (item.ImageSets && item.ImageSets.ImageSet){
                for (i=0; i < item.ImageSets.ImageSet.length; i++){
                    if (i==7){
                        break;
                    }

                    if (item.ImageSets.ImageSet[i] && item.ImageSets.ImageSet[i].LargeImage && item.ImageSets.ImageSet[i].LargeImage.URL){

                        altImgsDivText+=    '<li>'+
                                                '<img class="itemAltImg-box" src="'+item.ImageSets.ImageSet[i].LargeImage.URL+'"'+
                                                'onmouseover="setmainpic(this);"'+
                                                '>'+
                                            '</li>';

                        if (i==0){
                            mainImgDivText = '<img class="itemMainImg" src="'+item.ImageSets.ImageSet[0].LargeImage.URL+'">';
                            if (sessionStorage){
                                sessionStorage.setItem('currentItemImgURL', item.ImageSets.ImageSet[0].LargeImage.URL);
                            }
                        }
                    }
                }

                if (altImgsDivText != ''){
                    $itemAltImgsUL.empty();
                    $itemAltImgsUL.append(altImgsDivText);
                }
                if (mainImgDivText != ''){
                    $itemMainImgDiv.empty();
                    $itemMainImgDiv.append(mainImgDivText);
                }
            }



            $(".overlay").hide();
            viewController('itemDetails');
        }
        else
        {
            $(".overlay").hide();
        }

    });
    //END Receive Item Lookup Results

    //ADD TO CART
    function addToCartClicked(){
        if (sessionStorage && sessionStorage.getItem('currentRetailer')){
            var currentRetailer = sessionStorage.getItem('currentRetailer');
            if (sessionStorage.getItem(currentRetailer+'-CartId') && sessionStorage.getItem(currentRetailer+'-HMAC')){
                //add to existing cart here;
                console.log('adding to existing cart');
                if (sessionStorage.getItem('currentOfferListingId')){
                    $(".overlay").show();
                    socket.emit('addToCart', {retailer: currentRetailer, offerListingId: sessionStorage.getItem('currentOfferListingId'), quantity: $quantityDropDown.val(), cartId: sessionStorage.getItem(currentRetailer+'-CartId'), hmac: sessionStorage.getItem(currentRetailer+'-HMAC')});
                }
            }
            else
            {
                //create a new cart here;
                console.log('creating new cart');
                if (sessionStorage.getItem('currentOfferListingId')){
                    $(".overlay").show();
                    socket.emit('createCart', {retailer: currentRetailer, offerListingId: sessionStorage.getItem('currentOfferListingId'), quantity: $quantityDropDown.val()});
                }
            }
        }
    }
    //END ADD TO CART
    //Receive New Cart
    socket.on('createCartResult', function(data){
        console.log(data);
        if (sessionStorage && sessionStorage.getItem('currentRetailer') && data.CartCreateResponse){
            var currentRetailer = sessionStorage.getItem('currentRetailer');

            if (data.CartCreateResponse.Cart && data.CartCreateResponse.Cart.CartId){
                sessionStorage.setItem(currentRetailer+'-CartId', data.CartCreateResponse.Cart.CartId);
            }
            if (data.CartCreateResponse.Cart && data.CartCreateResponse.Cart.HMAC){
                sessionStorage.setItem(currentRetailer+'-HMAC', data.CartCreateResponse.Cart.HMAC);
            }
            if (data.CartCreateResponse.Cart && data.CartCreateResponse.Cart.URLEncodedHMAC){
                sessionStorage.setItem(currentRetailer+'-URLEncodedHMAC', data.CartCreateResponse.Cart.URLEncodedHMAC);
            }
        }

        if (sessionStorage && sessionStorage.getItem('currentRetailer')){
            var currentRetailer = sessionStorage.getItem('currentRetailer');

            if (sessionStorage.getItem(currentRetailer+'-cartItemDetailArray')){
                sessionStorage.removeItem(currentRetailer+'-cartItemDetailArray');
            }

            var ASIN = '';
            var imgURL = '';
            var maxQty = '';

            if (sessionStorage.getItem('currentASIN')){
                ASIN = sessionStorage.getItem('currentASIN');
            }
            if (sessionStorage.getItem('currentItemImgURL')){
                imgURL = sessionStorage.getItem('currentItemImgURL');
            }
            if (sessionStorage.getItem('currentItemMaxQty')){
                maxQty = sessionStorage.getItem('currentItemMaxQty');
            }

            sessionStorage.setItem(currentRetailer+'-cartItemDetailArray', JSON.stringify([{'ASIN':ASIN, 'imgURL':imgURL, 'maxQty':maxQty}]));

            sessionStorage.setItem(currentRetailer+'-cartItemCount', '1');
            $cartMainButton.empty();
            $cartMainButton.append('<img id="cartImage" src="/cartWhite2000.png" /> 1 Item');
            $cartMainButton.show();
        }

        $(".overlay").hide();

        viewCart();
    });
    //END Receive New Cart
    //Receive Add to Cart Result
    socket.on('addToCartResult', function(data){
        console.log(data);

        if (sessionStorage && sessionStorage.getItem('currentRetailer')){ 
            var currentRetailer = sessionStorage.getItem('currentRetailer');

            if (sessionStorage.getItem(currentRetailer+'-cartItemDetailArray')){
                var imgDetailArray = JSON.parse(sessionStorage.getItem(currentRetailer+'-cartItemDetailArray'));

                var ASIN = '';
                var imgURL = '';
                var maxQty = '';

                if (sessionStorage.getItem('currentASIN')){
                    ASIN = sessionStorage.getItem('currentASIN');
                }
                if (sessionStorage.getItem('currentItemImgURL')){
                    imgURL = sessionStorage.getItem('currentItemImgURL');
                }
                if (sessionStorage.getItem('currentItemMaxQty')){
                    maxQty = sessionStorage.getItem('currentItemMaxQty');
                }

                imgDetailArray.push({'ASIN':ASIN,'imgURL':imgURL, 'maxQty':maxQty});

                sessionStorage.setItem(currentRetailer+'-cartItemDetailArray', JSON.stringify(imgDetailArray));
            }

            if (sessionStorage.getItem(currentRetailer+'-cartItemCount')){
                var cartItemCount = parseInt(sessionStorage.getItem(currentRetailer+'-cartItemCount'));
                cartItemCount++;

                sessionStorage.setItem(currentRetailer+'-cartItemCount', cartItemCount.toString());

                $cartMainButton.empty();
                $cartMainButton.append('<img id="cartImage" src="/cartWhite2000.png" /> '+cartItemCount.toString()+' Items');
                $cartMainButton.show();
            }
        }


        $(".overlay").hide();

        viewCart();
    });
    //END receive Add to Cart Result

    //BEGIN View Cart
    function viewCart(){
        console.log('here 2');
        if (sessionStorage && sessionStorage.getItem('currentRetailer')){
            var currentRetailer = sessionStorage.getItem('currentRetailer');

            if (sessionStorage.getItem(currentRetailer+'-CartId') && sessionStorage.getItem(currentRetailer+'-HMAC')){
                $(".overlay").show();
                socket.emit('getCart', {retailer: currentRetailer, cartId: sessionStorage.getItem(currentRetailer+'-CartId'), hmac: sessionStorage.getItem(currentRetailer+'-HMAC')});
            }
        }
    }
    //END View Cart
    //Receive Get Cart
    socket.on('getCartResult', function(data){

        console.log(data);

        if (data.isFailed && data.isFailed == true){
            viewCart();
        }

        $checkoutMainDiv.empty();
        $cartItemOuterContainer.empty();

        var cartItemOuterContainerDivText = '';
        var checkoutMainDivText = '';

        var currentRetailer = '';
        var itemCountString = '';
        var subtotalString = '';
        var detailArray = [];

        if (sessionStorage && sessionStorage.getItem('currentRetailer')){
            currentRetailer = sessionStorage.getItem('currentRetailer');

            if (sessionStorage.getItem(currentRetailer+'-cartItemDetailArray')){
                detailArray = JSON.parse(sessionStorage.getItem(currentRetailer+'-cartItemDetailArray'));
            }
        }

        if (data.CartGetResponse && data.CartGetResponse.Cart){
            var cart = data.CartGetResponse.Cart;

            if (cart.CartItems){

                // ----------  BEGIN CART ITEMS --------- 

                if (cart.CartItems.CartItem){

                    var items = [];

                    if (cart.CartItems.CartItem.constructor === Array){
                        for (i=0; i < cart.CartItems.CartItem.length; i++){
                            items.push(cart.CartItems.CartItem[i]);
                        }
                    }
                    else
                    {
                        items.push(cart.CartItems.CartItem);
                    }
                    console.log('items lenght: '+items.length);

                    for (i=0; i<items.length; i++){
                        var item = items[i];

                        var ASIN = '';
                        var title = '';
                        var merchant = '';
                        var price = '';
                        var quantity = '';
                        var imgURL = '';
                        var maxQty = 1;
                        var cartItemId = '';

                        if (item.ASIN){
                            ASIN = item.ASIN;

                            if (detailArray && detailArray.constructor === Array && detailArray.length > 0){
                                for (t=0;t<detailArray.length;t++){
                                    if (detailArray[t].ASIN && detailArray[t].ASIN == ASIN){
                                        if (detailArray[t].imgURL){
                                            imgURL = detailArray[t].imgURL;    
                                        }
                                        
                                        if (detailArray[t].maxQty){
                                            maxQty = parseInt(detailArray[t].maxQty);
                                        }
                                    }
                                }
                            }
                        }

                        if (item.CartItemId){
                            cartItemId = item.CartItemId;
                        }

                        if (item.Title){
                            title = item.Title;
                        }

                        if (item.SellerNickname){
                            merchant = item.SellerNickname;
                        }

                        if (item.Quantity){
                            quantity = item.Quantity;
                        }

                        if (item.Price && item.Price.FormattedPrice){
                            price = item.Price.FormattedPrice;
                        }

                        cartItemOuterContainerDivText +=
                                        '<div class="cartItemContainerDiv col-md-12">'+
                                            '<div class="cartItemLeftDiv col-md-8">'+
                                                '<div class="col-md-3">'+
                                                    '<img class="cartItemImg" src="'+imgURL+'"/>'+
                                                '</div>'+
                                                '<div class="col-md-9">'+
                                                    '<a onclick="itemLookup(&quot;'+ASIN+'&quot;)"><h5><b>'+title+'</b></h5></a>'+
                                                    '<p>Sold by <b>'+merchant+'</b></p>'+
                                                    '<button class="btn btn-primary" onclick="modifyCart(&quot;'+cartItemId+'&quot;,0);"'+
                                                            'style="padding:1px 10px 1px 10px !important">Delete</button>'+
                                                '</div>'+
                                            '</div>'+

                                            '<div class="cartItemCentreDiv col-md-2">'+
                                                '<p>'+price+'</p>'+
                                            '</div>'+

                                            '<div class="cartItemRightDiv col-md-2">'+
                                                '<div class="input-group">'+
                                                    '<span class="input-group-btn">'+
                                                      '<button type="button" class="btn btn-default btn-number" onclick="changeQuantity(&quot;'+cartItemId+'&quot;,&quot;minus&quot;)">'+
                                                          '<span class="glyphicon glyphicon-minus"></span>'+
                                                      '</button>'+
                                                    '</span>'+
                                                    '<input type="text" name="'+cartItemId+'" class="form-control input-number" value="'+quantity+'" min="1" max="'+maxQty+'">'+
                                                    '<span>'+
                                                      '<button type="button" class="btn btn-default btn-number" onclick="changeQuantity(&quot;'+cartItemId+'&quot;,&quot;plus&quot;);">'+
                                                          '<span class="glyphicon glyphicon-plus"></span>'+
                                                      '</button>'+
                                                    '</span>'+
                                                '</div>'+
                                            '</div>'+
                                        '</div>';
                    }

                    $cartItemOuterContainer.append(cartItemOuterContainerDivText);

                }

                // ----------  END CART ITEMS ---------

                // ----------  BEGIN item count and SUBTOTAL  -----------

                if (cart.CartItems.CartItem){
                    if (cart.CartItems.CartItem && cart.CartItems.CartItem.constructor === Array){
                        itemCountString = cart.CartItems.CartItem.length.toString() + ' items';
                        if (sessionStorage){
                            sessionStorage.setItem(currentRetailer+'-cartItemCount', cart.CartItems.CartItem.length);

                            $cartMainButton.empty();
                            $cartMainButton.append('<img id="cartImage" src="/cartWhite2000.png" /> '+cart.CartItems.CartItem.length+' Items');
                        }
                    }
                    else {
                        itemCountString = '1 item';
                        if (sessionStorage){
                            sessionStorage.setItem(currentRetailer+'-cartItemCount', '1');

                            $cartMainButton.empty();
                            $cartMainButton.append('<img id="cartImage" src="/cartWhite2000.png" /> 1 Item');
                        }
                    }
                }
                else
                {
                    if (sessionStorage && sessionStorage.getItem(currentRetailer+'-cartItemCount')){
                        var itemCount = parseInt(sessionStorage.getItem(currentRetailer+'-cartItemCount'));

                        if (itemCount && itemCount == 1){
                            itemCountString = '1 item';
                        }
                        else 
                        {
                            itemCountString = itemCount.toString() + ' items';
                        }
                    }
                }

                if (cart.CartItems.SubTotal && cart.CartItems.SubTotal.FormattedPrice){
                    subtotalString = cart.CartItems.SubTotal.FormattedPrice;
                }
                else
                {
                    if (cart.SubTotal && cart.SubTotal.FormattedPrice){
                        subtotalString = cart.SubTotal.FormattedPrice;
                    }
                }
                checkoutMainDivText += '<div class="checkoutMainDivItem">'+
                                                '<p><b>Subtotal ('+itemCountString+'): </b>'+subtotalString+'</p>'+
                                            '</div>';

                // --------  END item count and SUBTOTAL  ---------

                // --------  BEGIN Checkout Button  -----------

                if (cart.PurchaseURL){
                    checkoutMainDivText += '<div class="checkoutMainDivItem">'+
                                                '<a href="'+cart.PurchaseURL+'" target="_blank">'+
                                                    '<button class="btn btn-primary" onclick="viewCart();">Proceed to Checkout</button>'+
                                                '</a>'+
                                            '</div>'
                }

                // --------  END Checkout Button  -----------

                $checkoutMainDiv.append(checkoutMainDivText);
            }
            else {
                if (sessionStorage && sessionStorage.getItem(currentRetailer+'-cartItemCount')){
                    sessionStorage.setItem(currentRetailer+'-cartItemCount', '0');
                }

                $cartMainButton.empty();
                $cartMainButton.hide();
                $('.overlay').hide();
                return;
            }
        }        

        viewController('viewCart');
        $('.overlay').hide();
    });

    //End Receive Cart
    //BEGIN Cart Plus Minus Click
    function changeQuantity(cartItemId, changeType){
        console.log('plusminusbuttonclicked: '+cartItemId+', '+changeType);
        
        var input = $("input[name='"+cartItemId+"']");
        var currentVal = parseInt(input.val());
        console.log('current: '+currentVal);
        if (!isNaN(currentVal)) {
            if(changeType == 'minus') {
                
                if(currentVal > input.attr('min')) {
                    // input.val(currentVal - 1).change();
                    modifyCart(cartItemId, (currentVal - 1));
                } 
                if(parseInt(input.val()) == input.attr('min')) {
                    $(this).attr('disabled', true);
                }

            } else if(changeType == 'plus') {

                if(currentVal < input.attr('max')) {
                    // input.val(currentVal + 1).change();
                    modifyCart(cartItemId, (currentVal + 1));
                }
                if(parseInt(input.val()) == input.attr('max')) {
                    $(this).attr('disabled', true);
                }

            }
        } else {
            input.val(0);
        }
    };
    //END Cart Plus Minus Click
    //BEGIN modify cart
    function modifyCart(cartItemId, quantity){
        console.log('cartITemId: '+cartItemId+', quantity: '+ quantity);
        if (sessionStorage && sessionStorage.getItem('currentRetailer')){
            var currentRetailer = sessionStorage.getItem('currentRetailer');

            if (sessionStorage.getItem(currentRetailer+'-CartId') && sessionStorage.getItem(currentRetailer+'-HMAC')){
                $(".overlay").show();
                socket.emit('modifyCart', {retailer: currentRetailer, cartId: sessionStorage.getItem(currentRetailer+'-CartId'), hmac: sessionStorage.getItem(currentRetailer+'-HMAC'), cartItemId: cartItemId, quantity: quantity});
            }
        }
    }
    //END modify cart

    //Receive modify cart result
    socket.on('modifyCartResult', function(data){
        console.log(data);

        $(".overlay").hide();
        viewCart();
    });
    //END receive modify cart result

    function viewController(mode){
        switch(mode){
            case 'homeBanner':
                // SHOW
                $bannersArea.show();
                $searchResultsArea.show();

                // HIDE
                $storeArea.hide();
                $tabSelector.hide();
                $itemDetails.hide();
                $shoppingCartArea.hide();

                $chatPane.hide();
                break;
            case 'searchResults':
                //SHOW
                $storeArea.show();
                $searchResultsArea.show();

                //HIDE
                $bannersArea.hide();
                $tabSelector.hide();
                $itemDetails.hide();
                $shoppingCartArea.hide();

                $chatPane.hide();
                break;
            case 'itemDetails':
                //SHOW
                $storeArea.show();
                $itemDetails.show();

                //HIDE
                $bannersArea.hide();
                $tabSelector.hide();
                $searchResultsArea.hide();
                $shoppingCartArea.hide();

                $chatPane.hide();
                break;
            case 'viewCart':
                //SHOW
                $storeArea.show();
                $shoppingCartArea.show();

                //HIDE
                $itemDetails.hide();
                $bannersArea.hide();
                $tabSelector.hide();
                $searchResultsArea.hide();
                $chatPane.hide();
                break;
            case 'huddleOn':
                $fbButton.hide();
                $fbLogout.show();
                break;
            case 'huddleOff':
                $fbButton.show();
                $fbLogout.hide();
                break;
            default:
                break;
        }
    }

    $('#searchWords').autocomplete({
        source: function(Query, Response) {
            $.ajax({
                url: "https://completion.amazon.com/search/complete",
                  dataType: "jsonp",
                  data: {
                    q: Query.term,
                    "search-alias": "aps",
                    client: "amazon-search-ui",
                    mkt: 1,

                  },
                success: function(Data) {

                    if (Data) {
                        var DataArr = Data.toString().split(',');
                        var Queries = new Array();
                        for (var q = 1; q < (DataArr.length - 1); q++) {
                            DataArr[q] = $.trim(DataArr[q]);
                            if (0 < DataArr[q].length && DataArr[q] != '[object Object]' && !$.isNumeric(DataArr[q])) {
                                Queries.push(DataArr[q]);
                            }
                        }
                        if (0 < Queries.length) {
                            Response(Queries);
                        }
                    }
                }
            });
        },
        delay: 1000,
        minLength: 2
    });

// </script>
