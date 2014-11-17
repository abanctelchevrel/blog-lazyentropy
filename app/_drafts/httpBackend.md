---
layout: post
title:  "Mocked API in an Angular app : $httpBackend"
date:   2014-11-14 08:53:57
categories: jekyll update
---

Expliquer les différences entre [ngMockE2E.$httpBackend](https://docs.angularjs.org/api/ngMockE2E/service/$httpBackend) et [ngMock.$httpBackend](https://docs.angularjs.org/api/ngMock/service/$httpBackend).

Monter l'exemple d'une directive qui récupère de la donnée du serveur et qui l'affiche. La donnée de test est hardcodée dans la directive, alors qu'en vrai cette donnée est récupérée du serveur.

Montrer comment déplacer la données hardcodée dans le httpBackend. 

Montrer d'abord un exemple simple (récupération d'une liste d'items via un GET sur /items). Puis des exemples plus compliqués (POST, GET sur /items/:id ...)

<div class="focal-point up-3">
    <div><img src="http://placehold.it/574x350"></div>
</div>