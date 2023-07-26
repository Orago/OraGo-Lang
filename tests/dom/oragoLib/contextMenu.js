import { newNode as n } from './dom.js';

// Function to start observing the DOM
function startObserving({ node, hide, allowChildClick }) {
  const clickHide = (event) => {
    if (node.contains(event.target) || node?.node == event.target)
      return event.preventDefault();

    hide(event);
  }
  // Create a new MutationObserver instance
  const observer = new MutationObserver(function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && !node.exists()) {
        // Node was removed, remove the event listener and stop observing
        document.removeEventListener('click', clickHide);
        observer.disconnect();
        return;
      }
    }
  });

  // Configure and start observing the target node
  var config = { childList: true, subtree: true };
  observer.observe(document, config);

  // Add your event listener to the document
  document.addEventListener('click', clickHide);
}

export default function createContextMenu ({ parent = document.body, reposition = true, allowChildClick = false } = {}){
  const node = (
    n.div
      .styles({
        listStyle: 'none',
        boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)',
        position: 'absolute',
        display: 'none', /* hide initially */
        zIndex: 1000,
        flexDirection: 'column'
      })
      .appendTo(parent)
  );

  const show = (...content) => (event) => {
    event.preventDefault(); // Prevent the default browser context menu

    node.clear().styles({ display: 'flex' }).append(...content);

    if (reposition == true)
      node.styles({
        top: event.pageY + 'px',
        left: event.pageX + 'px'
      });
  }

  const hide = () => node.styles({ display: 'none' });

  startObserving({ node, hide, allowChildClick });
  
  return {
    node,
    show,
    hide,
  };
}
