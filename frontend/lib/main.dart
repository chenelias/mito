import 'package:flutter/material.dart';
import 'package:mito/component/home_screen.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart';

void main() {
  runApp(
    ShadcnApp(
      title: "Mito",
      home: HomeScreen(),
      debugShowCheckedModeBanner: false,
    ),
  );
}
