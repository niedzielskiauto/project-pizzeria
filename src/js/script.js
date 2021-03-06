/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

// const { active } = require("browser-sync");

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      totalPriceBottom: '.cart__order-total .cart__order-price-sum strong',
      subTotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 10,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };

  class Product{
    constructor(id, data){
      const thisProduct = this;
      
      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    renderInMenu(){
      const thisProduct = this;
      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);
      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);
      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }


    getElements(){
      const thisProduct = this;
    
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion(){
      const thisProduct = this;
  
      /* find the clickable trigger (the element that should react to clicking) */
      // const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
  
      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function(event){
     
        /* prevent default action for event */
        event.preventDefault();
      
        /* find active product (product that has active class) */
        const activeProduct = document.querySelectorAll(select.all.menuProductsActive);
      
        /* if there is active product and it's not thisProduct.element, remove class active from it */
        for (let active of activeProduct) {

          if(active !== thisProduct.element) {

            active.classList.remove(classNames.menuProduct.wrapperActive);
          }
        }
        
        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }

    initOrderForm() {
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }


    initAmountWidget() {
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      });
    }


    processOrder() {
      const thisProduct = this;
    
      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
      
    
      // set price to default price
      let price = thisProduct.data.price;
    
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
       
        // for each option in category
        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        
          if(optionImage) {
            if(optionSelected) {
              optionImage.classList.add(classNames.menuProduct.wrapperActive);
            }
            else {
              optionImage.classList.remove(classNames.menuProduct.wrapperActive);
            }
          }

          if(optionSelected) {
          
            if (!option.default) {

              price += option.price;
            }

          } else {

            if(option.default) {

              price -= option.price;
            }
          }
        }
      }

      /* Multiply price by amount */
      price *= thisProduct.amountWidget.value;
      // update calculated price in the HTML
      thisProduct.priceSingle = price;

      thisProduct.priceElem.innerHTML = price;
    }


    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }

    prepareCartProduct(){
      const thisProduct = this;

      const productSummary = {};

      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = productSummary.priceSingle * productSummary.amount;
      productSummary.params = thisProduct.prepareCartProductParams();
    
      return productSummary;
    
    }

    prepareCartProductParams() {
      const thisProduct = this;
    
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};

      // for very category (param)
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
        params[paramId] = {
          label: param.label,
          options: {}
        };
    
        // for every option in this category
        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId); 
         
          if(optionSelected) {
            // option is selected!
            params[paramId].options[optionId] = option.label;
          }
        }
      }
    
      return params;
    }
  }
  

  class AmountWidget{
    constructor(element){
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();  
      
    }

    getElements(element){
      const thisWidget = this;
    
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
      
    }


    announce(){
      const thisWidget = this;

      const event = new CustomEvent ('updated',{
        bubbles: true
      });
      
      thisWidget.element.dispatchEvent(event);
    }


    setValue(value){
      const thisWidget = this;

      const newValue = parseInt(value);

      if(thisWidget.value !== newValue && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
        thisWidget.value = newValue;
        thisWidget.announce();
      }
      thisWidget.input.value = thisWidget.value;
    }


    initActions() {
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function () {
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      }); 
    }
  }


  class Cart{
    constructor(element){
      const thisCart = this;

      // Products add to the koszyk
      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();
     
    }


    getElements(element) {
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;

      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subTotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subTotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
      thisCart.dom.totalPriceBottom = thisCart.dom.wrapper.querySelector(select.cart.totalPriceBottom); 
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    }

    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(){
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      });
      
    }

    add(menuProduct){
      const thisCart = this;
      
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
     
      thisCart.update();
    }

    update(){
      const thisCart = this;

      const deliveryFee = settings.cart.defaultDeliveryFee;
     

      let totalNumber = 0; //ca??kowita suma
      let subTotalPrice = 0; // wszystko ale bez ceny za dostaw??

      for(let product of thisCart.products){
        totalNumber += product.amount;
        subTotalPrice += product.price;
      }

      if(totalNumber == 0) {
        thisCart.totalPrice = 0;
      } else {
        thisCart.totalPrice = subTotalPrice + deliveryFee;
        thisCart.dom.deliveryFee.innerHTML = deliveryFee;
        thisCart.dom.subTotalPrice.innerHTML = subTotalPrice;
        thisCart.dom.totalNumber.innerHTML = totalNumber;
        thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
        thisCart.dom.totalPriceBottom.innerHTML = thisCart.totalPrice;
      }

    }
    remove(removeProduct) {
    const thisCart = this;

    const indexOfProduct = thisCart.products.indexOf(CartProduct);
    thisCart.products.splice(indexOfProduct, 1);

    removeProduct.dom.wrapper.remove();
    thisCart.update();
  }
}

    class CartProduct{
      constructor(menuProduct, element) {
        const thisCartProduct = this;

        thisCartProduct.id = menuProduct.id;
        thisCartProduct.name = menuProduct.name;
        thisCartProduct.amount = menuProduct.amount;
        thisCartProduct.priceSingle = menuProduct.priceSingle;
        thisCartProduct.price = menuProduct.price;
        thisCartProduct.amountWidget = menuProduct.amountWidget;

        thisCartProduct.getElements(element);
        thisCartProduct.initAmountWidget();
        thisCartProduct.initActions();


      }

      getElements(element) {
        const thisCartProduct = this;
        thisCartProduct.dom = {};

        thisCartProduct.dom.wrapper = element;
        thisCartProduct.dom.amountWidget = element.querySelector(select.cartProduct.amountWidget);
        thisCartProduct.dom.price = element.querySelector(select.cartProduct.price);
        thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
        thisCartProduct.dom.remove = element.querySelector(select.cartProduct.remove);
      }


      initAmountWidget(){
        const thisCartProduct = this;

        thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
        thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
          thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amountWidget.value;
          thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
        });
      }

      remove(){
        const thisCartProduct = this;
  
        const event = new CustomEvent('remove', {
          bubbles: true,
          detail: {
            cartProduct: thisCartProduct,
          },
        });
        
        thisCartProduct.dom.wrapper.dispatchEvent(event);
      }

      initActions(){
        const thisCartProduct = this;
  
        thisCartProduct.dom.edit.addEventListener('click', function (event){
          event.preventDefault();
        });
  
        thisCartProduct.dom.remove.addEventListener('click', function (event){
          event.preventDefault();
          thisCartProduct.remove();
        });

      }
    }
 




  


  const app = {
    initMenu: function(){
      const thisApp = this;
      
      for(let productData in thisApp.data.products){
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initData: function(){
      const thisApp = this;
      thisApp.data = dataSource;
    },


    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },


    init: function(){
      const thisApp = this;
     
      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };

  app.init();
  
}
