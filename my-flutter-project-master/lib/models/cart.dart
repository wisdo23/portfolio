import 'package:flutter/material.dart';

import 'shoe.dart';

class Cart extends ChangeNotifier {
  // list of shoes for sale
  List<Shoe> shoeShop = [
    Shoe(
        name: 'Zoom Freak',
        price: '236',
        imagePath: 'lib/images/Zoomfreak1.png',
        description:
            'The forward-thinking design of his latest signature shoe.'),
    Shoe(
        name: 'Air Jordans',
        price: '220',
        imagePath: 'lib/images/jordan.png',
        description:
            'You\'ve got hops and the speed-lace up in shoes that enhance'),
    Shoe(
        name: 'KD Treys',
        price: '240',
        imagePath: 'lib/images/KDTREY2E.png',
        description:
            'A secure midfoot strap is suited for scoring binges and defensive'),
    Shoe(
        name: 'kyrie 7',
        price: '190',
        imagePath: 'lib/images/kyrie7.png',
        description:
            'Bouncy cushioning is paired with soft yet supporting from for rest'),
    Shoe(
        name: 'Kyrie Low',
        price: '160',
        imagePath: 'lib/images/Nike-Kyrie-Low-4-1-World-1-People-CW3985-600-1.png',
        description: 'A low profile for quick cuts and all-day court feel.'),
    Shoe(
        name: 'Jordan Retro',
        price: '250',
        imagePath:
            'lib/images/off-white-air-jordan-1-retro-high-og-unc-aq0818-148-lateral.png',
        description: 'A high-top classic with a clean lateral profile.'),
    Shoe(
        name: 'KD Trey Classic',
        price: '210',
        imagePath: 'lib/images/KDTREY.png',
        description: 'Light on the foot, built for long scoring nights.'),
    Shoe(
        name: 'Zoom Freak Low',
        price: '200',
        imagePath: 'lib/images/Zoomfreak.png',
        description: 'A lower cut of the same forward-thinking cushioning.'),
    Shoe(
        name: 'Court Cream',
        price: '145',
        imagePath: 'lib/images/court-cream.png',
        description: 'Cream leather and a quiet sole for everyday wear.'),
    Shoe(
        name: 'Night Runner',
        price: '175',
        imagePath: 'lib/images/runner-black.png',
        description: 'A black runner with a bright white midsole.'),
    Shoe(
        name: 'Cobalt Court',
        price: '155',
        imagePath: 'lib/images/court-blue.png',
        description: 'Cobalt leather with a clean white cupsole.'),
  ];

  // list of items in user cart
  List<Shoe> userCart = [];

  // get list of shoes for sale
  List<Shoe> getShoeList() {
    return shoeShop;
  }

  // get cart
  List<Shoe> getUserCart() {
    return userCart;
  }

  //add items to cart
  void addItemToCart(Shoe shoe) {
    userCart.add(shoe);
    notifyListeners();
  }

  // remove item from cart
  void removeItemFromCart(Shoe shoe) {
    userCart.remove(shoe);
    notifyListeners();
  }
}
