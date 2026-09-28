import 'package:flutter/material.dart';

import 'home_page.dart';

class introPage extends StatelessWidget {
  const introPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final gap = (constraints.maxHeight * 0.04).clamp(12.0, 40.0);
            final logoHeight = (constraints.maxHeight * 0.34).clamp(80.0, 260.0);

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 16),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight - 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      height: logoHeight,
                      child: Image.asset(
                        'lib/images/nike.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                    SizedBox(height: gap),
                    const Text(
                      'Just Do It',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: gap),
                    const Text(
                      'Brand new sneakers and customs made with premium quality',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: gap),
                    GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const HomePage()),
                      ),
                      child: Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.grey[900],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        child: const Center(
                          child: Text(
                            'Shop Now',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
