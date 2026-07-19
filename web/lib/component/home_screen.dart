import 'package:mito/component/header.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  var label = "";

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Header(),
        PrimaryButton(
          child: Text("Hello"),
          onPressed: () {
            setState(() {
              label = "Nice to meet you";
            });
          },
        ),
        Text(label),
      ],
    );
  }
}
