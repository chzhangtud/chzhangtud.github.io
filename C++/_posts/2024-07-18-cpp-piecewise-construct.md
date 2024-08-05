---
title: "C++ 内存优化(一): `std::piecewise_construct` 配合 `std::forward_as_tuple`"
lang: "zh"
date: 2024-07-18
permalink: /zh/cpp-piecewise-construct./
# en_link: /en/rtr-aa-1/
categories:
tags:
---

<style>
body {
  font-size: 14px;
}
.container {
  max-width: 1200px;
  margin: 0 auto; /* 使页面居中 */
}
</style>

<head>
  <script>
    MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']]
      }
    };
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>

* TOC
{:toc}

# `std::piecewise_construct` 介绍
`std::piecewise_construct` 是 C++ 标准库中的一个标签，它用于在创建`std::pair`和 `td::tuple` 对象时，控制构造函数的调用方式。通常在与 `std::tuple` 和 `std::forward_as_tuple` 等函数结合使用时，可以更加灵活地构造对象。

当创建 `std::pair` 时，默认情况下，两个成员对象会被独立地构造。但在某些情况下，特别是当成员对象是复杂类型时，可能需要更细粒度的控制来避免不必要的拷贝或移动操作。这时候 `std::piecewise_construct` 就派上用场了。

# `std::forward_as_tuple` 介绍
`std::forward_as_tuple` 是 C++ 标准库中的一个函数模板，定义在 `<tuple>` 头文件中。它用于将参数打包成一个 `std::tuple`，并且在打包过程中保持参数的值类别（`lvalue` 或 `rvalue`），这使得其在转发参数时非常有用。

主要特点

- 保持值类别：`std::forward_as_tuple` 可以保持传递给它的每个参数的值类别。如果参数是一个 `rvalue`，它会被打包为 `std::tuple` 的 `rvalue`。如果参数是一个 `lvalue`，它会被打包为 `std::tuple` 的 `lvalue`，这对于完美转发非常重要。
- 用于完美转发：`std::forward_as_tuple` 在模板编程和完美转发中非常有用。它可以与 `std::tuple` 和 `std::apply` 等结合使用，以便在处理函数参数时保留其原始值类别。

# 实例
以下实例介绍了如何配合使用`std::piecewise_construct`和`std::forward_as_tuple`来减少程序中的内存拷贝。
`A` 和 `B` 类都定义了拷贝构造函数，在创建拷贝时会打印log，用于观察对象是否被拷贝构造。
当创建 `std::pair` 时，默认情况下，两个成员对象会被各自独立地构造，然后再传递给`std::pair`.
在这个例子中，`std::piecewise_construct` 标签告诉 `std::pair` 的构造函数：不要直接构造 `A` 和 `B` 对象，而是分别使用两个 `std::tuple` 提供的参数来构造 `A` 和 `B` 对象。`std::forward_as_tuple` 创建了一个 `std::tuple`，该元组将传递给 `A` 和 `B` 的构造函数。
```cpp
#include <iostream>
#include <string>
#include <tuple>
#include <utility>

class A {
public:
    // 普通构造函数
    A(const std::string& s, int x) : s_(s), x_(x) {
        std::cout << "A(const std::string&, int) called with " << s << " and " << x << std::endl;
    }

    // 拷贝构造函数
    A(const A& other) : s_(other.s_), x_(other.x_) {
        std::cout << "A(const A&) called, copied with " << s_ << " and " << x_ << std::endl;
    }

private:
    std::string s_;
    int x_;
};

class B {
public:
    // 普通构造函数
    B(const std::string& s, double y) : s_(s), y_(y) {
        std::cout << "B(const std::string&, double) called with " << s << " and " << y << std::endl;
    }

    // 拷贝构造函数
    B(const B& other) : s_(other.s_), y_(other.y_) {
        std::cout << "B(const B&) called, copied with " << s_ << " and " << y_ << std::endl;
    }

private:
    std::string s_;
    double y_;
};

int main() {
    std::string largeString = "This is a very large string that we don't want to copy unnecessarily";
    
    // 使用 std::piecewise_construct 和 std::forward_as_tuple 构造 std::pair
    std::cout << "Creating std::pair using std::piecewise_construct and std::forward_as_tuple:" << std::endl;
    std::pair<A, B> p(std::piecewise_construct,
                      std::forward_as_tuple(largeString, 42),
                      std::forward_as_tuple(largeString, 3.14));

    std::cout << "\nCreating std::pair directly (which could involve unnecessary copies):" << std::endl;
    // 直接构造 A 和 B 对象
    A a(largeString, 42);
    B b(largeString, 3.14);
    
    // 将 A 和 B 对象传递给 std::pair 的构造函数
    std::pair<A, B> p_direct(a, b);

    return 0;
}

```

代码输出如下：
```shell
$ ./program
Creating std::pair using std::piecewise_construct and std::forward_as_tuple:
A(const std::string&, int) called with This is a very large string that we don't want to copy unnecessarily and 42
B(const std::string&, double) called with This is a very large string that we don't want to copy unnecessarily and 3.14

Creating std::pair directly (which could involve unnecessary copies):
A(const std::string&, int) called with This is a very large string that we don't want to copy unnecessarily and 42
B(const std::string&, double) called with This is a very large string that we don't want to copy unnecessarily and 3.14
A(const A&) called, copied with This is a very large string that we don't want to copy unnecessarily and 42
B(const B&) called, copied with This is a very large string that we don't want to copy unnecessarily and 3.14
```

# 扩展
模板编程中常常使用`std::forward`进行完美转发，避免引用折叠导致的内存拷贝操作，这个话题单独开个小文章讨论。

**本博文内容为作者原创，转载请注明出处并附上原文链接，感谢支持与理解。**