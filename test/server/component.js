import '../../lib/isorender/dom-shims';

import { expect } from 'chai';
import requestAnimationFrameCB from 'raf';

import { SimpleApp } from '../fixtures/simple-app';
import { NestedApp, NestedChild } from '../fixtures/nested-app';
document.registerElement('nested-app', NestedApp);
document.registerElement('nested-child', NestedChild);
document.registerElement('simple-app', SimpleApp);

const requestAnimationFrame = () => new Promise(requestAnimationFrameCB);

describe('Server-side component renderer', function() {
  it('can register and create components with document.createElement', function() {
    const el = document.createElement('simple-app');
    expect(el.state).to.eql({});
    el.attachedCallback();
    expect(el.state).to.eql({foo: 'bar'});
  });

  it('supports class instantiation', function() {
    const el = new SimpleApp();
    expect(el.state).to.eql({});
    el.attachedCallback();
    expect(el.state).to.eql({foo: 'bar'});
  });

  it('renders a simple component', async function() {
    const el = new SimpleApp();
    el.attachedCallback();

    await requestAnimationFrame();

    const html = el.innerHTML;
    expect(html).to.contain('<DIV class="foo">');
    expect(html).to.contain('Value of foo: bar');
    expect(html).to.contain('Foo capitalized: Bar');
  });

  it('renders updates', async function() {
    const el = new SimpleApp();
    el.attachedCallback();

    await requestAnimationFrame();

    expect(el.textContent).to.contain('Value of foo: bar');
    expect(el.textContent).to.contain('Foo capitalized: Bar');
    el.update({foo: 'new value'});

    await requestAnimationFrame();

    expect(el.textContent).to.contain('Value of foo: new value');
    expect(el.textContent).to.contain('Foo capitalized: New value');
  });

  it('renders nested components', async function() {
    const el = new NestedApp();
    el.attachedCallback();

    await requestAnimationFrame();

    // check DOM structure
    expect(el.childNodes).to.have.lengthOf(1);
    expect(el.childNodes[0].className).to.equal('nested-foo');
    expect(el.childNodes[0].childNodes).to.have.lengthOf(2);

    const nestedChild = el.childNodes[0].childNodes[1];
    expect(nestedChild.childNodes).to.have.lengthOf(1);
    expect(nestedChild.childNodes[0].className).to.equal('nested-foo-child');
    expect(nestedChild.childNodes[0].childNodes).to.have.lengthOf(2);

    // check content/HTML output
    const html = el.innerHTML;
    expect(html).to.contain('<DIV class="nested-foo">');
    expect(html).to.contain('Nested app: test');
    expect(html).to.contain('<DIV class="nested-foo-child">');
    expect(html).to.contain('parent title: test');
    expect(html).to.contain('animal: llama');
  });

  it('updates nested components', async function() {
    const el = new NestedApp();
    el.attachedCallback();

    await requestAnimationFrame();

    const nestedChild = el.childNodes[0].childNodes[1];
    expect(nestedChild.state.title).to.equal('test');
    nestedChild.update({title: 'meow'});

    await requestAnimationFrame();

    expect(el.state.title).to.equal('meow');
    expect(el.innerHTML).to.contain('Nested app: meow');
    expect(nestedChild.innerHTML).to.contain('parent title: meow');
    el.update({title: 'something else'});

    await requestAnimationFrame();

    expect(nestedChild.innerHTML).to.contain('parent title: something else');
  });
});
